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
} from "react-icons/fi";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { canAccessAdminPanel } from "@/lib/rolePermissions";

const STATS_CACHE_KEY = "admin-dashboard-stats";
const STATS_CACHE_TTL = 60 * 1000; // 1 minute cache window

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
      console.error("Failed to read cached stats:", error);
    }
  }, []);

  const fetchStats = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setErrorMessage(null);
      const res = await axios.get("/api/admin/stats", { timeout: 10000 });
      setStats(res.data);
      const timestamp = Date.now();
      setLastUpdated(timestamp);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          STATS_CACHE_KEY,
          JSON.stringify({ data: res.data, timestamp }),
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setErrorMessage("Unable to load dashboard stats. Please try again.");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      if (!canAccessAdminPanel(session?.user?.role as any)) {
        router.push("/");
        return;
      }

      fetchStats({ silent: hasWarmCache });
    }
  }, [status, session, router, fetchStats, hasWarmCache]);

  const isInitialLoading = !stats && isLoading;

  if (isInitialLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "var(--primary-color, #000000)" }}
        ></div>
      </div>
    );
  }

  if (!stats && errorMessage) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 space-y-4 shadow-sm w-full max-w-lg mt-10">
        <p className="text-red-700 font-medium text-sm">{errorMessage}</p>
        <button
          onClick={() => fetchStats()}
          className="bg-red-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-red-700 transition"
          disabled={isLoading}
        >
          {isLoading ? "Retrying..." : "Try again"}
        </button>
      </div>
    );
  }

  const handleRefresh = () => fetchStats({ silent: Boolean(stats) });
  const formattedUpdatedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : null;

  return (
    <div className="space-y-12">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Overview
          </h2>
          {formattedUpdatedTime && (
            <p className="text-sm text-gray-400 mt-2 font-light">
              Last synced at {formattedUpdatedTime}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-500 hover:text-black transition-colors pb-1 border-b border-transparent hover:border-black disabled:opacity-50 disabled:pointer-events-none"
          disabled={isRefreshing}
        >
          <FiRefreshCw
            className={`transition-transform ${isRefreshing ? "animate-spin" : ""}`}
            size={14}
          />
          {isRefreshing ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {errorMessage && stats && (
        <div className="border border-red-200 bg-white p-4 text-sm text-red-600 animate-pulse mb-8">
          <span className="font-semibold">Notice:</span> Showing cached data.{" "}
          {errorMessage}
        </div>
      )}

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Revenue */}
        <div className="relative bg-transparent border-b border-gray-200 pb-6">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-light text-xs uppercase tracking-widest mb-2">
                Total Revenue
              </p>
              <p className="text-4xl font-light text-gray-900 tracking-tight">
                {formatPrice(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="text-gray-300">
              <FiDollarSign strokeWidth={1} size={32} />
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="relative bg-transparent border-b border-gray-200 pb-6">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-light text-xs uppercase tracking-widest mb-2">
                Total Orders
              </p>
              <p className="text-4xl font-light text-gray-900 tracking-tight">
                {stats?.totalOrders || 0}
              </p>
            </div>
            <div className="text-gray-300">
              <FiPackage strokeWidth={1} size={32} />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="relative bg-transparent border-b border-gray-200 pb-6">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-light text-xs uppercase tracking-widest mb-2">
                Products
              </p>
              <p className="text-4xl font-light text-gray-900 tracking-tight">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <div className="text-gray-300">
              <FiShoppingBag strokeWidth={1} size={32} />
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="relative bg-transparent border-b border-gray-200 pb-6">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-light text-xs uppercase tracking-widest mb-2">
                Customers
              </p>
              <p className="text-4xl font-light text-gray-900 tracking-tight">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="text-gray-300">
              <FiUsers strokeWidth={1} size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Row */}
      <div className="my-12">
        <h3 className="text-sm uppercase tracking-widest text-gray-400 font-semibold mb-6">
          Order Pipeline
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="border-l-2 border-yellow-400 pl-4 py-1">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
              Pending
            </p>
            <p className="text-2xl font-light text-gray-900">
              {stats?.pendingOrders || 0}
            </p>
          </div>
          <div className="border-l-2 border-blue-400 pl-4 py-1">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
              Processing
            </p>
            <p className="text-2xl font-light text-gray-900">
              {stats?.processingOrders || 0}
            </p>
          </div>
          <div className="border-l-2 border-purple-400 pl-4 py-1">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
              Shipped
            </p>
            <p className="text-2xl font-light text-gray-900">
              {stats?.shippedOrders || 0}
            </p>
          </div>
          <div className="border-l-2 border-green-400 pl-4 py-1">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
              Delivered
            </p>
            <p className="text-2xl font-light text-gray-900">
              {stats?.deliveredOrders || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-light text-gray-900 tracking-tight">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-gray-400 hover:text-black uppercase tracking-widest transition-colors border-b border-transparent hover:border-black"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-4 pr-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Order ID
                </th>
                <th className="pb-4 px-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Customer
                </th>
                <th className="pb-4 px-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Date
                </th>
                <th className="pb-4 px-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Total
                </th>
                <th className="pb-4 px-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Status
                </th>
                <th className="pb-4 pl-6 text-right text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentOrders?.map((order: any) => (
                <tr
                  key={order._id}
                  className="group transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30"
                >
                  <td className="py-5 pr-6 font-mono text-gray-500 tracking-tight text-xs">
                    #{order._id.slice(-8)}
                  </td>
                  <td className="py-5 px-6 font-light text-gray-900 text-sm">
                    {order.user?.name || "Guest"}
                  </td>
                  <td className="py-5 px-6 text-gray-500 text-sm font-light whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-5 px-6 text-gray-900 text-sm font-medium">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="py-5 px-6">
                    <span
                      className={`px-2 py-0.5 inline-flex text-[10px] uppercase tracking-wider font-semibold border ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || "text-gray-600 border-gray-200"}`}
                    >
                      {
                        ORDER_STATUS_LABELS[
                          order.status as keyof typeof ORDER_STATUS_LABELS
                        ]
                      }
                    </span>
                  </td>
                  <td className="py-5 pl-6 text-right">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="text-xs font-medium text-gray-400 hover:text-black border-b border-transparent hover:border-black transition-colors pb-0.5"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm font-light text-gray-500"
                  >
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Branding */}
    </div>
  );
}
