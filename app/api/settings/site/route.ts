import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.findOne({ key: "site" });
    if (!settings) {
      return NextResponse.json({
        logo: "/homyorganic.png",
        favicon: "/logo.png",
      });
    }
    return NextResponse.json(settings.value);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch site settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await connectDB();

    const updated = await Setting.findOneAndUpdate(
      { key: "site" },
      { value: data },
      { new: true, upsert: true },
    );

    return NextResponse.json(updated.value);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 },
    );
  }
}
