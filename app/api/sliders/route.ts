import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Slider from "@/models/Slider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all sliders
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all");

    if (all === "true") {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required", code: "NOT_AUTHENTICATED" },
          { status: 401 },
        );
      }
      if (session.user.role !== "admin") {
        return NextResponse.json(
          { error: "Admin access required", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
      // Return all sliders for admin
      const sliders = await Slider.find().sort("order");
      return NextResponse.json({
        sliders,
        count: sliders.length,
        adminView: true,
      });
    }

    // Return only active sliders for frontend
    const sliders = await Slider.find({ isActive: true }).sort("order");

    return NextResponse.json({
      sliders,
      count: sliders.length,
    });
  } catch (error: any) {
    console.error("Get sliders error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch sliders",
        code: "SLIDER_FETCH_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}

// POST - Create slider (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required", code: "NOT_AUTHENTICATED" },
        { status: 401 },
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await connectDB();

    const data = await req.json();

    // Validate required fields
    if (!data.title || !data.image) {
      return NextResponse.json(
        {
          error: "Title and image are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Get max order
    const maxSlider = await Slider.findOne().sort("-order");
    const nextOrder = maxSlider ? maxSlider.order + 1 : 0;

    const slider = await Slider.create({
      title: data.title,
      image: data.image,
      buttonText: data.buttonText,
      buttonLink: data.buttonLink,
      position: data.position || "top",
      isActive: data.isActive ?? true,
      order: nextOrder,
    });

    return NextResponse.json(slider, { status: 201 });
  } catch (error: any) {
    console.error("Create slider error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to create slider";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "SLIDER_CREATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}
