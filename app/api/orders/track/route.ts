import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, phone, query } = body || {};

    const cleanOrderId = (orderId || query || "").trim();
    const cleanPhone = (phone || (query && !orderId ? query : "")).trim();

    if (!cleanOrderId && !cleanPhone) {
      return NextResponse.json(
        { error: "Please enter your Order ID or Phone Number to track your order." },
        { status: 400 }
      );
    }

    await connectDB();

    const searchConditions: any[] = [];

    // 1. If valid MongoDB ObjectId
    if (cleanOrderId && mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      searchConditions.push({ _id: cleanOrderId });
    }

    // 2. If phone number provided or entered in query
    if (cleanPhone) {
      // Normalize phone digits for fuzzy matching (e.g. 03023735860 or 923023735860)
      const digitsOnly = cleanPhone.replace(/\D/g, "");
      const phonePattern = digitsOnly.length >= 7 ? digitsOnly.slice(-7) : digitsOnly;

      if (phonePattern) {
        searchConditions.push({
          "shippingAddress.phone": { $regex: phonePattern, $options: "i" },
        });
      }
    }

    // 3. Match paymentReference or trackingNumber if any identifier provided
    if (cleanOrderId) {
      searchConditions.push({
        paymentReference: { $regex: cleanOrderId, $options: "i" },
      });
      searchConditions.push({
        trackingNumber: { $regex: cleanOrderId, $options: "i" },
      });
    }

    if (searchConditions.length === 0) {
      return NextResponse.json(
        { error: "No orders found. Please check your Order ID or Phone Number." },
        { status: 404 }
      );
    }

    const orders = await Order.find({ $or: searchConditions })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "No order found matching the provided details. Please verify your Order ID or Phone Number." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: JSON.parse(JSON.stringify(orders)),
    });
  } catch (error: any) {
    console.error("Order tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track order. Please try again." },
      { status: 500 }
    );
  }
}
