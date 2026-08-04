import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { hasPermission } from "@/lib/rolePermissions";

// GET all categories
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const categories = await Category.find({}).sort({ name: 1 });

    return NextResponse.json({
      categories,
      count: categories.length,
    });
  } catch (error: any) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch categories",
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

// POST - Create new category (Admin only)
export async function POST(req: NextRequest) {
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

    const data = await req.json();
    const { name, description, image, showInNav } = data;

    if (!name) {
      return NextResponse.json(
        {
          error: "Category name is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    const slug = await generateUniqueSlug(Category, name, undefined, data.slug);

    const category = await Category.create({
      name,
      description,
      image: image || "/logo.png",
      slug,
      showInNav: showInNav !== undefined ? showInNav : true,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Create category error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to create category";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    } else if (error?.code === 11000) {
      statusCode = 409;
      errorMessage = "Category with this slug already exists";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "CATEGORY_CREATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}
