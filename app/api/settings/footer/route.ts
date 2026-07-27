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
        tagline: "Modern essentials crafted for everyday elegance.",
        contact: {
          email: "info@Homy Oraganic.store",
          phone: "+92 336 8249118",
          address: "Multan, Pakistan",
        },
        socials: {
          facebook: "https://facebook.com/homyorganics",
          twitter: "https://twitter.com/homyorganic",
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
