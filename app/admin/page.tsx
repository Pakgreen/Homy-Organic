"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiRefreshCw,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { canAccessAdminPanel } from "@/lib/rolePermissions";

const STATS_CACHE_KEY = "admin-dashboard-stats";
const STATS_CACHE_TTL = 60 * 1000;

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasWarmCache, setHasWarmCache] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedRaw = sessionStorage.getItem(STATS_CACHE_KEY);
    if (!cachedRaw) return;
    try {
      const cached = JSON.parse(cachedRaw);
      if (Date.now() - cached.timestamp < STATS_CACHE_TTL) {
        setStats(cached.data);
        setLastUpdated(cached.timestamp);
        setIsLoading(false);
        setHasWarmCache(true);
      } else {
        sessionStorage.removeItem(STATS_CACHE_KEY);
      }
    } catch (error) {
      sessionStorage.removeItem(STATS_CACHE_KEY);
    }
  }, []);

  const fetchStats = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      setErrorMessage(null);
      const res = await axios.get("/api/admin/stats", { timeout: 10000 });
      setStats(res.data);
      const timestamp = Date.now();
      setLastUpdated(timestamp);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data: res.data, timestamp }));
      }
    } catch (error) {
      setErrorMessage("Unable to load dashboard stats. Please try again.");
    } finally {
      if (silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/admin-login");
      return;
    }
    if (status === "authenticated") {
      if (!canAccessAdminPanel(session?.user?.role as any)) {
        router.push("/auth/admin-login");
        return;
      }
      fetchStats({ silent: hasWarmCache });
    }
  }, [status, session, router, fetchStats, hasWarmCache]);

  if (!stats && isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-7 w-7 border-b-2"
          style={{ borderColor: "var(--primary-color, #000000)" }}
        />
      </div>
    );
  }

  if (!stats && errorMessage) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 space-y-4 w-full max-w-lg mt-10">
        <p className="text-red-700 font-medium text-sm">{errorMessage}</p>
        <button
          onClick={() => fetchStats()}
          className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 transition text-sm"
          disabled={isLoading}
        >
          {isLoading ? "Retrying..." : "Try again"}
        </button>
      </div>
    );
  }

  const handleRefresh = () => fetchStats({ silent: Boolean(stats) });
  const formattedUpdatedTime = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : null;

  // Stat cards data
  const statCards = [
    {
      label: "Total Revenue",
      value: formatPrice(stats?.totalRevenue || 0),
      icon: <FiDollarSign size={20} />,
      accent: "#B9853A",
      bg: "#FDF6EC",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: <FiPackage size={20} />,
      accent: "#3A7BD5",
      bg: "#EEF3FB",
    },
    {
      label: "Products",
      value: stats?.totalProducts || 0,
      icon: <FiShoppingBag size={20} />,
      accent: "#2DA44E",
      bg: "#EEF8F2",
    },
    {
      label: "Customers",
      value: stats?.totalUsers || 0,
      icon: <FiUsers size={20} />,
      accent: "#8B5CF6",
      bg: "#F3F0FF",
    },
  ];

  // Pipeline cards
  const pipeline = [
    { label: "Pending", value: stats?.pendingOrders || 0, icon: <FiClock size={18} />, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Processing", value: stats?.processingOrders || 0, icon: <FiAlertCircle size={18} />, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Shipped", value: stats?.shippedOrders || 0, icon: <FiTruck size={18} />, color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "Delivered", value: stats?.deliveredOrders || 0, icon: <FiCheckCircle size={18} />, color: "#10B981", bg: "#ECFDF5" },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Overview</h2>
          {formattedUpdatedTime && (
            <p className="text-xs text-gray-400 mt-0.5">Last synced at {formattedUpdatedTime}</p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 disabled:opacity-40 cursor-pointer w-fit"
        >
          <FiRefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {errorMessage && stats && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
          <span className="font-semibold">Notice:</span> Showing cached data. {errorMessage}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 hover:border-gray-200 transition-colors min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{card.label}</p>
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: card.bg, color: card.accent }}
              >
                {card.icon}
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight truncate">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Order Pipeline */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Order Pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pipeline.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-gray-200 transition-colors min-w-0"
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.bg, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{item.label}</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex justify-between items-center px-4 sm:px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/admin/orders" className="text-xs font-medium text-gray-400 hover:text-black transition-colors">
            View all →
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map((order: any) => (
                <tr key={order._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4 font-mono text-gray-400 text-xs">#{order._id.slice(-8)}</td>
                  <td className="px-5 py-4 text-gray-800 text-sm font-medium">{order.user?.name || "Guest"}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-gray-900 text-sm font-semibold">{formatPrice(order.totalPrice)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-wide font-semibold rounded-full border ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || "text-gray-600 border-gray-200 bg-gray-50"}`}>
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/orders/${order._id}`} className="text-xs font-medium text-gray-400 hover:text-black transition-colors">View</Link>
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No recent orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {stats?.recentOrders?.map((order: any) => (
            <div key={order._id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[11px] text-gray-400">#{order._id.slice(-8)}</span>
                  <span className={`px-2 py-0.5 text-[9px] uppercase font-semibold rounded-full border ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || "text-gray-600 border-gray-200 bg-gray-50"}`}>
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{order.user?.name || "Guest"}</p>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">{formatPrice(order.totalPrice)}</p>
                <Link href={`/admin/orders/${order._id}`} className="text-xs text-gray-400 hover:text-black transition-colors">View →</Link>
              </div>
            </div>
          ))}
          {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
            <p className="px-4 py-10 text-center text-sm text-gray-400">No recent orders found.</p>
          )}
        </div>
      </div>

    </div>
  );
}
