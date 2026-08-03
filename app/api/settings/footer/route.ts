import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.findOne({ key: "footer" });
    if (!settings) {
      return NextResponse.json({
        brandName: "Homy Orgaic",
        tagline: "Where Beauty Meets Wellness",
        contact: {
          email: "info@homyorganic.store",
          phone: "+92302 3735860",
          address: "Multan, Pakistan",
        },
        socials: {
          facebook: "https://facebook.com/homyorganics",
          tiktok: "https://tiktok.com/@homyorganic",
          instagram: "https://instagram.com/homyorganic",
        },
        links: [{ label: "Shop", url: "/products" }],
      });
    }
    return NextResponse.json(settings.value);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
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
      { key: "footer" },
      { value: data },
      { new: true, upsert: true },
    );

    return NextResponse.json(updated.value);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
