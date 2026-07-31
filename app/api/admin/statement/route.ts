import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPanel } from "@/lib/rolePermissions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canAccessAdminPanel(session.user?.role as any)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { startDate, endDate, status, isPaid } = await req.json();

    await connectDB();

    const query: any = {};

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Status filtering
    if (status && status !== "ALL") {
      query.status = status;
    }

    // Payment filtering
    if (isPaid === true) {
      query.isPaid = true;
    } else if (isPaid === false) {
      query.isPaid = false;
    }

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Summary calculations
    let totalRevenue = 0;
    let totalOrders = orders.length;
    let deliveredOrders = 0;
    let pendingOrders = 0;
    let totalItemsSold = 0;

    orders.forEach((o: any) => {
      totalRevenue += o.totalPrice || 0;
      if (o.status === "delivered") deliveredOrders++;
      if (o.status === "pending") pendingOrders++;

      if (Array.isArray(o.orderItems)) {
        o.orderItems.forEach((item: any) => {
          totalItemsSold += item.quantity || 1;
        });
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalItemsSold,
        period: {
          startDate: startDate || (orders.length > 0 ? orders[orders.length - 1].createdAt : new Date()),
          endDate: endDate || new Date(),
        },
      },
      orders: JSON.parse(JSON.stringify(orders)),
    });
  } catch (error: any) {
    console.error("Statement generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate statement report" },
      { status: 500 }
    );
  }
}
