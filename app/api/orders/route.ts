import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildOrderEmail, sendEmail } from "@/lib/mailer";
import { hasPermission } from "@/lib/rolePermissions";

const allowedPaymentMethods = ["Prepaid", "Cash on Delivery"];

type IncomingOrderItem = {
  product: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

const sanitizeTrim = (val: unknown) =>
  typeof val === "string" ? val.trim() : "";

const validateOrderPayload = (
  orderItems: IncomingOrderItem[],
  shippingAddress: any,
  paymentMethod: string,
  paymentReference: string,
  paymentProofUrl: string,
  contactEmail?: string,
) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return "No order items provided";
  }

  for (const item of orderItems) {
    if (!item?.product || !item?.name)
      return "Each item needs product id and name";
    if (!Number.isFinite(item.quantity) || item.quantity <= 0)
      return "Each item needs a quantity greater than 0";
    if (!Number.isFinite(item.price) || item.price < 0)
      return "Each item needs a valid price";
  }

  const fullName = sanitizeTrim(shippingAddress?.fullName);
  const address = sanitizeTrim(shippingAddress?.address);
  const phone = sanitizeTrim(shippingAddress?.phone);

  if (!fullName || !/^[A-Za-z\s]{3,60}$/.test(fullName)) {
    return "Full name must be letters/spaces (3-60 chars)";
  }

  if (!address || address.length < 8) {
    return "Address is too short";
  }

  const digitsOnlyPhone = phone.replace(/[^0-9]/g, "");
  if (digitsOnlyPhone.length < 10 || digitsOnlyPhone.length > 15) {
    return "Enter a valid phone number";
  }

  if (paymentMethod === "Prepaid") {
    const reference = sanitizeTrim(paymentReference);
    if (!/^[A-Za-z0-9-]{8,25}$/.test(reference)) {
      return "Enter a valid transaction ID";
    }

    const proofUrl = sanitizeTrim(paymentProofUrl);
    if (!proofUrl || proofUrl.length < 10) {
      return "Payment proof image is required";
    }
  }

  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return "Unsupported payment method";
  }

  const email = sanitizeTrim(contactEmail);
  if (!email) {
    return "An email address is required to confirm your order";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  return null;
};

// GET orders
// - Admin: all orders
// - Authenticated user: only their own orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required", code: "NOT_AUTHENTICATED" },
        { status: 401 },
      );
    }

    await connectDB();

    const hasManageOrders = hasPermission(session.user.role as any, "manage_orders");

    const normalizedEmail = (session.user.email || "").trim().toLowerCase();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const query = hasManageOrders
      ? {}
      : {
          $or: [
            { user: session.user.id },
            {
              contactEmail: {
                $regex: `^${escapedEmail}$`,
                $options: "i",
              },
            },
          ],
        };

    // Pagination params
    const url = req.nextUrl;
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    let page = Number(pageParam) || 1;
    let limit = Number(limitParam) || 10;
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    if (page > totalPages) page = totalPages;

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      orders,
      count: totalCount,
      page,
      totalPages,
      limit,
    });
  } catch (error: any) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch orders",
        code: "ORDER_FETCH_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      contactEmail,
      paymentReference,
      paymentProofUrl,
    } = await req.json();

    const recipientEmail =
      typeof contactEmail === "string"
        ? contactEmail.trim().toLowerCase()
        : session?.user?.email;

    const validationError = validateOrderPayload(
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentReference,
      paymentProofUrl,
      recipientEmail,
    );

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Recalculate pricing on the server to prevent tampering
    const productIds = orderItems.map((item: any) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const priceMap = new Map(products.map((p) => [p._id.toString(), p.price]));

    let computedItemsPrice = 0;
    const normalizedOrderItems = orderItems.map((item: any) => {
      const unitPrice = priceMap.get(item.product) ?? 0;
      const safeQty = Number.isFinite(item.quantity) ? item.quantity : 0;
      computedItemsPrice += unitPrice * safeQty;
      return {
        ...item,
        price: unitPrice,
        quantity: safeQty,
      };
    });

    const settingsDoc = await Setting.findOne({ key: "site" });
    const siteSettings = settingsDoc?.value || {};

    const allowedMode = siteSettings.allowedPaymentMethods || "both";
    if (allowedMode === "cod" && paymentMethod !== "Cash on Delivery") {
      return NextResponse.json(
        { error: "Only Cash on Delivery is currently allowed.", code: "PAYMENT_METHOD_DISABLED" },
        { status: 400 }
      );
    }
    if (allowedMode === "prepaid" && paymentMethod !== "Prepaid") {
      return NextResponse.json(
        { error: "Only Prepaid transfer payment is currently allowed.", code: "PAYMENT_METHOD_DISABLED" },
        { status: 400 }
      );
    }

    const safeShipping = siteSettings.deliveryChargesEnabled
      ? Number(siteSettings.deliveryChargeAmount) || 0
      : 0;

    const safeTax = Number.isFinite(taxPrice) && taxPrice >= 0 ? taxPrice : 0;
    const computedTotal = computedItemsPrice + safeShipping + safeTax;

    const validUserId =
      session?.user?.id && typeof session.user.id === "string" && session.user.id.trim()
        ? session.user.id.trim()
        : undefined;

    const order = await Order.create({
      user: validUserId,
      contactEmail: recipientEmail,
      orderItems: normalizedOrderItems,
      shippingAddress: {
        fullName: sanitizeTrim(shippingAddress.fullName),
        address: sanitizeTrim(shippingAddress.address),
        phone: shippingAddress.phone,
        city: sanitizeTrim(shippingAddress.city) || "",
        postalCode: sanitizeTrim(shippingAddress.postalCode) || "",
        country: sanitizeTrim((shippingAddress as any).country) || "",
      },
      paymentMethod,
      itemsPrice: computedItemsPrice,
      shippingPrice: safeShipping,
      taxPrice: safeTax,
      totalPrice: computedTotal,
      paymentReference:
        paymentMethod === "Cash on Delivery" ? "COD" : paymentReference,
      paymentProofUrl,
    });

    // Do not await the email to make checkout faster
    Promise.resolve(
      buildOrderEmail({
        customerName: shippingAddress?.fullName || session?.user?.name,
        orderId: order._id.toString(),
        orderItems,
        totalPrice,
        shippingAddress,
        paymentMethod,
      }),
    )
      .then((orderEmail: any) => {
        return sendEmail({
          to: recipientEmail,
          subject: orderEmail.subject,
          html: orderEmail.html,
          attachments: orderEmail.attachments,
        });
      })
      .catch((emailError: any) => {
        console.error("Order email error:", emailError);
      });

    const plainOrder = order.toObject ? order.toObject() : order;

    return NextResponse.json(
      { ...plainOrder, emailSent: false },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create order error:", error);
    console.error("Error stack:", error?.stack);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to create order";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors || {}).join(", ")}`;
    } else if (error?.name === "CastError") {
      statusCode = 400;
      errorMessage = `Invalid data format for field: ${error?.path || "unknown"}`;
    }

    return NextResponse.json(
      {
        error: errorMessage || "An error occurred while creating the order",
        code: "ORDER_CREATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}
