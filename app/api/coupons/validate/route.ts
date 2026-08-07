import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Token/Discount code is required", valid: false },
        { status: 400 }
      );
    }

    const orderSubtotal = Number(subtotal) || 0;
    const normalizedCode = code.trim().toUpperCase();

    await connectDB();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid token or discount code", valid: false },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This token is currently inactive", valid: false },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This token code has expired", valid: false },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Token usage limit reached", valid: false },
        { status: 400 }
      );
    }

    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount of PKR ${coupon.minOrderAmount.toLocaleString()} required for this token`,
          valid: false,
        },
        { status: 400 }
      );
    }

    // Calculate Discount
    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = (orderSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
    } else {
      calculatedDiscount = coupon.discountValue;
    }

    calculatedDiscount = Math.min(calculatedDiscount, orderSubtotal);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: calculatedDiscount,
      influencerName: coupon.influencerName || undefined,
      message: `Token "${coupon.code}" applied! Saved PKR ${calculatedDiscount.toLocaleString()}`,
    });
  } catch (error: any) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to validate token", valid: false },
      { status: 500 }
    );
  }
}
