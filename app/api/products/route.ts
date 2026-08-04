import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
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
    inStock: plain?.inStock !== false && (typeof plain?.stock !== "number" || plain.stock > 0),
    stock: typeof plain?.stock === "number" ? plain.stock : 100,
    weight: plain?.weight || "",
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
    }

    if (bestSeller === "true") {
      query.isBestSeller = true;
    } else if (bestSeller === "false") {
      query.isBestSeller = { $ne: true };
    }

    if (category) {
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({
          $or: [
            { slug: category.toLowerCase() },
            {
              name: {
                $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
              },
            },
          ],
        });
        if (catDoc) {
          query.category = catDoc._id;
        } else {
          query.category = null;
        }
      }
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
  let data: any = {};
  let normalizedImages: string[] = [];

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

    data = await req.json();

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
    normalizedImages = Array.isArray(data.images)
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

    const slug = await generateUniqueSlug(Product, data.name, undefined, data.slug);

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

    if (error?.code === 11000) {
      try {
        const fallbackSlug = `${generateSlug(String(data?.name ?? "product"))}-${Date.now().toString(36)}`;
        const product = await Product.create({
          ...data,
          slug: fallbackSlug,
          images: normalizedImages,
          imageLabels: Array.isArray(data.imageLabels) ? data.imageLabels : [],
        });
        return NextResponse.json(withPriceAliases(product), { status: 201 });
      } catch (fallbackError) {
        console.error("Fallback product creation error:", fallbackError);
      }
    }

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
