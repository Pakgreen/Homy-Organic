import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Slider from "@/models/Slider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

// PUT - Update slider (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          error: "Invalid slider ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const data = await req.json();

    const existing = await Slider.findById(id);

    if (!existing) {
      return NextResponse.json(
        {
          error: "Slider not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const updateData: Record<string, any> = {};
    if (typeof data.title === "string") updateData.title = data.title;
    if (typeof data.image === "string") updateData.image = data.image;
    if (typeof data.buttonText === "string")
      updateData.buttonText = data.buttonText;
    if (typeof data.buttonLink === "string")
      updateData.buttonLink = data.buttonLink;
    if (typeof data.position === "string") updateData.position = data.position;
    if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;
    if (typeof data.order === "number") updateData.order = data.order;

    const slider = await Slider.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Remove previous image from Cloudinary if it was replaced
    if (
      slider &&
      updateData.image &&
      existing.image &&
      existing.image !== updateData.image &&
      existing.image.includes("cloudinary.com")
    ) {
      await deleteFromCloudinary(existing.image);
      console.log("🗑️ Deleted old slider image from Cloudinary");
    }

    if (!slider) {
      return NextResponse.json(
        {
          error: "Slider not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(slider);
  } catch (error: any) {
    console.error("Update slider error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to update slider";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "SLIDER_UPDATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}

// DELETE slider (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          error: "Invalid slider ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const slider = await Slider.findById(id);

    if (!slider) {
      return NextResponse.json(
        {
          error: "Slider not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Delete image from Cloudinary
    if (slider.image && slider.image.includes("cloudinary.com")) {
      await deleteFromCloudinary(slider.image);
      console.log("🗑️ Deleted slider image from Cloudinary");
    }

    // Delete slider from database
    await Slider.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Slider deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("Delete slider error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to delete slider",
        code: "SLIDER_DELETE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}
