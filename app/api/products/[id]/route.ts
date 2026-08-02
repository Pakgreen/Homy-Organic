import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { deleteMultipleFromCloudinary } from "@/lib/cloudinary";
import { buildProductImageVariants } from "@/lib/productImages";
import { hasPermission } from "@/lib/rolePermissions";

const withPriceAliases = (product: any) => {
  const plain =
    typeof product?.toObject === "function" ? product.toObject() : product;
  const oldPrice =
    typeof plain?.originalPrice === "number" ? plain.originalPrice : undefined;
  const slug = plain?.slug || generateSlug(plain?.name || "product");

  return {
    ...plain,
    slug,
    newPrice: plain?.price,
    oldPrice,
    keyBenefits: Array.isArray(plain?.keyBenefits)
      ? plain.keyBenefits
      : typeof plain?.keyBenefits === "string"
        ? plain.keyBenefits.split("\n").filter(Boolean)
        : [],
    naturalIngredients: Array.isArray(plain?.naturalIngredients)
      ? plain.naturalIngredients
      : typeof plain?.naturalIngredients === "string"
        ? plain.naturalIngredients.split("\n").filter(Boolean)
        : [],
    howToUse: plain?.howToUse || "",
    precautions: plain?.precautions || "",
    ourQuality: plain?.ourQuality || "",
    imageVariants: buildProductImageVariants(plain),
  };
};

// GET single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const includeDisabled = req.nextUrl.searchParams.get("includeDisabled") === "true";
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          error: "Product ID is required",
          code: "MISSING_ID",
        },
        { status: 400 },
      );
    }
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    // Support fetching by MongoDB _id or slug
    let product = isObjectId
      ? await Product.findById(id).populate("category", "name slug")
      : null;

    if (!product) {
      product = await Product.findOne({ slug: id.toLowerCase() }).populate(
        "category",
        "name slug",
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (!includeDisabled && product.isDisabled) {
      return NextResponse.json(
        {
          error: "Product not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(withPriceAliases(product));
  } catch (error: any) {
    console.error("Get product error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch product",
        code: "PRODUCT_FETCH_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}

// PUT - Update product (Admin only)
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

    if (!hasPermission(session.user.role as any, "manage_products")) {
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
          error: "Invalid product ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const data = await req.json();

    // Remove immutable, alias, and computed fields to prevent MongoDB update failures
    delete data._id;
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;
    delete data.imageVariants;

    // Accept alias fields from clients: newPrice -> price, oldPrice -> originalPrice
    if (typeof data.newPrice === "number" && data.newPrice > 0) {
      data.price = data.newPrice;
    }
    delete data.newPrice;

    if (
      typeof data.oldPrice === "number" &&
      data.oldPrice > 0 &&
      (data.originalPrice === undefined || data.originalPrice === null)
    ) {
      data.originalPrice = data.oldPrice;
    }
    delete data.oldPrice;

    if (data.isValuePack) {
      data.category = null;
    } else if (data.category && typeof data.category === "object") {
      data.category = data.category._id || data.category;
    }

    if (data.images !== undefined) {
      data.images = Array.isArray(data.images)
        ? data.images.filter(
            (img: unknown): img is string =>
              typeof img === "string" && img.trim().length > 0,
          )
        : typeof data.images === "string" && data.images.trim().length > 0
          ? [data.images.trim()]
          : [];
    }

    const normalizeStringArray = (input: any) => {
      if (Array.isArray(input)) {
        return input.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
      }
      if (typeof input === "string" && input.trim()) {
        return input.split("\n").map((item) => item.trim()).filter(Boolean);
      }
      return [];
    };

    if (data.keyBenefits !== undefined) {
      data.keyBenefits = normalizeStringArray(data.keyBenefits);
    }
    if (data.naturalIngredients !== undefined) {
      data.naturalIngredients = normalizeStringArray(data.naturalIngredients);
    }

    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json(
        {
          error: "Product not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (data.name && data.name.trim() !== existingProduct.name) {
      const newSlug = generateSlug(data.name);
      if (newSlug !== existingProduct.slug) {
        const slugExists = await Product.findOne({ slug: newSlug, _id: { $ne: id } });
        if (slugExists) {
          data.slug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
        } else {
          data.slug = newSlug;
        }
      } else {
        delete data.slug;
      }
    } else {
      delete data.slug;
    }

    // If images changed, collect removed Cloudinary URLs for cleanup
    let removedImages: string[] = [];
    if (Array.isArray(data.images)) {
      const oldImages = Array.isArray(existingProduct.images)
        ? existingProduct.images
        : [];
      const newImages = data.images;
      removedImages = oldImages.filter(
        (img) =>
          img && img.includes("cloudinary.com") && !newImages.includes(img),
      );
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug");

    if (removedImages.length > 0) {
      const deletedCount = await deleteMultipleFromCloudinary(removedImages);
      console.log(
        `🗑️ Deleted ${deletedCount} outdated product images from Cloudinary`,
      );
    }

    return NextResponse.json(withPriceAliases(product));
  } catch (error: any) {
    console.error("Update product error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to update product";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "PRODUCT_UPDATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}

// DELETE product (Admin only)
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
          error: "Invalid product ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletedCount = await deleteMultipleFromCloudinary(product.images);
      console.log(`🗑️ Deleted ${deletedCount} images from Cloudinary`);
    }

    // Delete product from database
    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Product deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to delete product",
        code: "PRODUCT_DELETE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}
