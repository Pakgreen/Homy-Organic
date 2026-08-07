import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

// GET - List all coupons/tokens for Admin
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["admin", "moderator", "manager"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST - Create a new coupon/token
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["admin", "moderator", "manager"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      influencerName,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      expiresAt,
      isActive,
    } = body;

    if (!code || discountValue === undefined || discountValue === null || discountValue === "") {
      return NextResponse.json(
        { error: "Token/Coupon code and discount value are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedCode = String(code).trim().toUpperCase();

    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return NextResponse.json(
        { error: "Token code already exists" },
        { status: 400 }
      );
    }

    const newCoupon = await Coupon.create({
      code: normalizedCode,
      discountType: discountType || "percentage",
      discountValue: Number(discountValue),
      influencerName: influencerName ? String(influencerName).trim() : "",
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(
      { message: "Token created successfully", coupon: newCoupon },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

// DELETE - Remove coupon/token by ID
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    await Coupon.findByIdAndDelete(id);

    return NextResponse.json({ message: "Token deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete token" },
      { status: 500 }
    );
  }
}
