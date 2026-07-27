import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.findOne({ key: "theme_colors" });
    if (!settings) {
      return NextResponse.json({
        primaryColor: "#000000",
        headingColor: "#000000",
        textColor: "#374151",
        buttonBgColor: "#000000",
        buttonTextColor: "#ffffff",
        backgroundColor: "#ffffff",
        footerBgColor: "#ffffff",
        footerTextColor: "#374151",
      });
    }
    return NextResponse.json(settings.value);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch theme settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await connectDB();

    const updatedSettings = await Setting.findOneAndUpdate(
      { key: "theme_colors" },
      { value: data },
      { new: true, upsert: true },
    );

    return NextResponse.json(updatedSettings.value);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update theme settings" },
      { status: 500 },
    );
  }
}
