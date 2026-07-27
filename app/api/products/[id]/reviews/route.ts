import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";

// GET all reviews for a specific product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

// POST a new review for a specific product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, rating, comment } = body;

    if (!name || !rating || !comment) {
      return NextResponse.json(
        { error: "Name, rating, and comment are required fields" },
        { status: 400 },
      );
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 },
      );
    }

    // Create review
    const review = await Review.create({
      product: productId,
      name: name.trim(),
      rating: parsedRating,
      comment: comment.trim(),
    });

    // Recalculate average rating of the product
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;

    await Product.findByIdAndUpdate(productId, { ratings: avgRating });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: any) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit review" },
      { status: 500 },
    );
  }
}
