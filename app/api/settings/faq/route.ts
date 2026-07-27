import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Setting from "@/models/Setting";

export async function GET() {
  try {
    await dbConnect();
    const setting = await Setting.findOne({ key: "faq_accordion" });
    return NextResponse.json(setting?.value || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    await dbConnect();
    await Setting.findOneAndUpdate(
      { key: "faq_accordion" },
      { value: data },
      { upsert: true, new: true },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
