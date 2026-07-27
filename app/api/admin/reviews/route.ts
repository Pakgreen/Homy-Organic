import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import { hasPermission } from "@/lib/rolePermissions";
import "@/models/Product"; // Ensure Product schema is registered

// GET all reviews for admin panel
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user?.role, "manage_products")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const reviews = await Review.find()
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("Admin fetch reviews error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
