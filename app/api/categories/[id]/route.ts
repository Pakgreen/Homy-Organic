import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { hasPermission } from "@/lib/rolePermissions";

// GET single category
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          error: "Invalid category ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Get category error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch category",
        code: "CATEGORY_FETCH_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}

// PUT - Update category (Admin only)
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

    if (!hasPermission(session.user.role as any, "manage_categories")) {
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
          error: "Invalid category ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const data = await req.json();
    const updateData: Record<string, any> = {};

    if (data.slug) {
      updateData.slug = await generateUniqueSlug(Category, data.name || "category", id, data.slug);
    } else if (data.name) {
      updateData.name = data.name;
      updateData.slug = await generateUniqueSlug(Category, data.name, id);
    }
    if (typeof data.description === "string") {
      updateData.description = data.description;
    }
    if (typeof data.image === "string") {
      updateData.image = data.image;
    }
    if (typeof data.showInNav === "boolean") {
      updateData.showInNav = data.showInNav;
    }
    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Update category error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to update category";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "CATEGORY_UPDATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}

// DELETE category (Admin only)
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
          error: "Invalid category ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Delete category from database
    await Category.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Category deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to delete category",
        code: "CATEGORY_DELETE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}
