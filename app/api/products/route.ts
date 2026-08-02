import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { buildProductImageVariants } from "@/lib/productImages";
import { hasPermission } from "@/lib/rolePermissions";

const withPriceAliases = (product: any) => {
  const plain =
    typeof product?.toObject === "function" ? product.toObject() : product;
  const oldPrice =
    typeof plain?.originalPrice === "number" ? plain.originalPrice : undefined;

  return {
    ...plain,
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

// GET all products with filters
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const bestSeller = searchParams.get("bestSeller");
    const valuePack = searchParams.get("valuePack");
    const regularOnly = searchParams.get("regularOnly") === "true";
    const includeDisabled = searchParams.get("includeDisabled") === "true";
    const sort = searchParams.get("sort") || "-createdAt";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const query: any = {};

    if (!includeDisabled) {
      query.isDisabled = { $ne: true };
    }

    if (valuePack === "true") {
      query.isValuePack = true;
    } else if (valuePack === "false" || regularOnly) {
      query.isValuePack = { $ne: true };
    } else if (bestSeller !== "true") {
      // By default exclude Value Packs unless valuePack=true is explicitly requested
      query.isValuePack = { $ne: true };
    }

    if (bestSeller === "true") {
      query.isBestSeller = true;
    } else if (bestSeller === "false" || regularOnly) {
      query.isBestSeller = { $ne: true };
    } else if (valuePack !== "true") {
      // By default exclude Best Sellers unless bestSeller=true is explicitly requested
      query.isBestSeller = { $ne: true };
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products: products.map(withPriceAliases),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    const fallbackLimit = 12;
    // Gracefully degrade so UI never breaks on home/products pages
    return NextResponse.json({
      products: [],
      pagination: {
        page: 1,
        limit: fallbackLimit,
        total: 0,
        pages: 0,
      },
      error: error?.message || "Failed to fetch products",
      code: "PRODUCT_FETCH_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error?.toString() : undefined,
    });
  }
}

// POST - Create new product (Admin only)
export async function POST(req: NextRequest) {
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

    const data = await req.json();

    // Accept alias fields from clients: newPrice -> price, oldPrice -> originalPrice
    if (typeof data.newPrice === "number" && data.newPrice > 0) {
      data.price = data.newPrice;
    }
    if (
      typeof data.oldPrice === "number" &&
      data.oldPrice > 0 &&
      (data.originalPrice === undefined || data.originalPrice === null)
    ) {
      data.originalPrice = data.oldPrice;
    }
    const normalizedImages = Array.isArray(data.images)
      ? data.images.filter(
          (img: unknown): img is string =>
            typeof img === "string" && img.trim().length > 0,
        )
      : typeof data.images === "string" && data.images.trim().length > 0
        ? [data.images.trim()]
        : [];

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

    // Separate Value Packs from Category: Value Packs do not require or use Category
    if (data.isValuePack) {
      delete data.category;
    }

    // Validate required fields
    if (!data.name || !data.price || (!data.isValuePack && !data.category)) {
      return NextResponse.json(
        {
          error: data.isValuePack
            ? "Missing required fields: name, price"
            : "Missing required fields: name, price, category",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    const slug = generateSlug(data.name);

    if (typeof data.order !== "number") {
      const maxProduct = await Product.findOne().sort("-order");
      data.order = maxProduct && typeof maxProduct.order === "number" ? maxProduct.order + 1 : 1;
    }

    const product = await Product.create({
      ...data,
      slug,
      images: normalizedImages,
      imageLabels: Array.isArray(data.imageLabels) ? data.imageLabels : [],
    });

    return NextResponse.json(withPriceAliases(product), { status: 201 });
  } catch (error: any) {
    console.error("Create product error:", error);

    // Handle specific errors
    let statusCode = 500;
    let errorMessage = error?.message || "Failed to create product";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    } else if (error?.code === 11000) {
      statusCode = 409;
      errorMessage = "Product with this slug already exists";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "PRODUCT_CREATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}
