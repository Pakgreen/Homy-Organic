import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import { hasPermission } from "@/lib/rolePermissions";

// DELETE a specific review by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user?.role, "manage_products")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id: reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const productId = review.product;

    await Review.findByIdAndDelete(reviewId);

    // Recalculate average rating of the product
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;

    await Product.findByIdAndUpdate(productId, { ratings: avgRating });

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("Admin delete review error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete review" },
      { status: 500 },
    );
  }
}
