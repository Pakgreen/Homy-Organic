import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET public banner text
export async function GET() {
  try {
    await connectDB();
    const doc = await Setting.findOne({ key: "topBanner" });
    const enabled = doc?.value?.enabled ?? false;
    const text = enabled ? doc?.value?.text || "" : "";
    return NextResponse.json({ enabled, text, updatedAt: doc?.updatedAt ?? null });
  } catch (error: any) {
    console.error("Get banner error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 },
    );
  }
}

// PUT update banner text - admin only
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    await connectDB();
    const data = await req.json();
    const text = typeof data.text === "string" ? data.text.trim() : "";
    const enabled = typeof data.enabled === "boolean" ? data.enabled : false;

    if (!text && enabled) {
      return NextResponse.json({ error: "Text is required when enabled" }, { status: 400 });
    }

    const updated = await Setting.findOneAndUpdate(
      { key: "topBanner" },
      { value: { text, enabled } },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      enabled: updated.value.enabled,
      text: updated.value.text,
      updatedAt: updated.updatedAt,
    });
  } catch (error: any) {
    console.error("Update banner error:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 },
    );
  }
}
