"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { openOrderWhatsApp } from "@/lib/whatsapp";
import CourierShippingSlip from "@/components/CourierShippingSlip";
import {
  FiSearch,
  FiX,
  FiRefreshCw,
  FiPackage,
  FiChevronLeft,
  FiChevronRight,
  FiMessageCircle,
  FiPrinter,
} from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchOrders = async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await axios.get("/api/orders");
      const data = Array.isArray(res.data) ? res.data : res.data.orders || [];
      setOrders(data);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    const q = searchQuery.toLowerCase();
    return (
      order._id?.toLowerCase().includes(q) ||
      order._id?.slice(-8).toLowerCase().includes(q) ||
      order.user?.name?.toLowerCase().includes(q) ||
      order.user?.email?.toLowerCase().includes(q) ||
      order.shippingAddress?.fullName?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-xs bg-gray-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-50 flex gap-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Orders</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage and track all store orders</p>
          </div>
          {orders.length > 0 && (
            <span
              className="px-2.5 py-1 text-xs font-semibold rounded-full text-white"
              style={{ backgroundColor: "#B9853A" }}
            >
              {orders.length}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all cursor-pointer disabled:opacity-40 w-fit"
        >
          <FiRefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order ID or customer name..."
          className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
          >
            <FiX size={13} />
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF6EC] flex items-center justify-center mb-4">
            <FiPackage size={24} style={{ color: "#B9853A" }} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            {searchQuery ? "No matching orders" : "No orders yet"}
          </h3>
          <p className="text-sm text-gray-400 max-w-xs">
            {searchQuery ? `No results for "${searchQuery}"` : "Orders will appear here when customers place them."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-sm font-medium text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {filteredOrders.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order: any) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-gray-400 text-xs">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.user?.name || order.shippingAddress?.fullName || "Guest"}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{order.user?.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-wide font-semibold rounded-full border ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || "text-gray-600 border-gray-200 bg-gray-50"}`}>
                        {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-wide font-semibold rounded-full border ${order.isPaid ? "border-green-200 text-green-700 bg-green-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}>
                        {order.isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSlipOrder(order)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-black hover:text-white transition-colors cursor-pointer border border-gray-200"
                          title="Print Courier Shipping Slip (PDF)"
                        >
                          <FiPrinter size={14} />
                        </button>
                        {order.shippingAddress?.phone && (
                          <button
                            onClick={() => openOrderWhatsApp(order)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                            title="Send WhatsApp Order Confirmation"
                          >
                            <FiMessageCircle size={14} />
                          </button>
                        )}
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="text-xs font-semibold text-gray-400 hover:text-black transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedOrders.map((order: any) => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-100 p-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-400">#{order._id.slice(-8)}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                      {order.user?.name || order.shippingAddress?.fullName || "Guest"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{order.user?.email || "—"}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">
                    {formatPrice(order.totalPrice)}
                  </span>
                </div>

                {/* Middle badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wide font-semibold rounded-full border ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || "text-gray-600 border-gray-200 bg-gray-50"}`}>
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wide font-semibold rounded-full border ${order.isPaid ? "border-green-200 text-green-700 bg-green-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}>
                    {order.isPaid ? "Paid" : "Pending"}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(order.createdAt)}</span>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedSlipOrder(order)}
                    className="flex-1 py-2 text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200 rounded-lg hover:bg-black hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FiPrinter size={14} />
                    <span>Print Slip</span>
                  </button>
                  {order.shippingAddress?.phone && (
                    <button
                      onClick={() => openOrderWhatsApp(order)}
                      className="flex-1 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FiMessageCircle size={14} />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="flex-1 py-2 text-xs font-semibold text-center text-gray-600 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-black transition-all"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 bg-white px-4 py-3 border border-gray-200 rounded-xl text-xs">
              <span className="text-gray-500 font-medium">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <FiChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          currentPage === pageNum
                            ? "bg-black text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span>Next</span>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CourierShippingSlip
        order={selectedSlipOrder}
        isOpen={!!selectedSlipOrder}
        onClose={() => setSelectedSlipOrder(null)}
      />
    </div>
  );
}
