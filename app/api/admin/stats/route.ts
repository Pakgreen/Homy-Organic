import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdminPanel } from '@/lib/rolePermissions';

// GET admin statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NOT_AUTHENTICATED' },
        { status: 401 }
      );
    }

    if (!canAccessAdminPanel(session.user.role as any)) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await connectDB();

    const [totalUsers, totalOrders, totalProducts, orders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments(),
      Order.find({}).select('totalPrice createdAt status'),
    ]);

    const totalRevenue = (orders || []).reduce(
      (acc, order) => acc + (typeof order?.totalPrice === "number" ? order.totalPrice : 0),
      0
    );

    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const processingOrders = orders.filter((o) => o.status === 'processing').length;
    const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

    // Recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch statistics',
        code: 'STATS_FETCH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}
