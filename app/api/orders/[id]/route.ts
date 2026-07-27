import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rolePermissions";

// GET single order (Admin or order owner)
export async function GET(
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

    await connectDB();

    const { id } = await params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          error: "Invalid order ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const isOwnerId =
      order.user && order.user._id?.toString?.() === session.user.id;
    const isOwnerEmail =
      order.contactEmail &&
      session.user.email &&
      order.contactEmail.toLowerCase() === session.user.email.toLowerCase();
    const isOwner = isOwnerId || isOwnerEmail;

    const hasManageOrders = hasPermission(session.user.role as any, "manage_orders");
    if (!isOwner && !hasManageOrders) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Get order error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch order",
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

// PUT - Update order status (Admin only)
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

    if (!hasPermission(session.user.role as any, "manage_orders")) {
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
          error: "Invalid order ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const data = await req.json();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (data.status) {
      order.status = data.status;

      if (data.status === "delivered") {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
    }

    if (data.trackingNumber) {
      order.trackingNumber = data.trackingNumber;
    }

    if (data.isPaid !== undefined) {
      order.isPaid = data.isPaid;
      if (data.isPaid) {
        order.paidAt = new Date();
      }
    }

    await order.save();

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Update order error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to update order";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "ORDER_UPDATE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}

// DELETE order (Admin only)
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
          error: "Invalid order ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Order deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to delete order",
        code: "ORDER_DELETE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}
