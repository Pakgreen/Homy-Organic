"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  FiPrinter,
  FiX,
  FiFileText,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCreditCard,
  FiTruck,
  FiCopy,
  FiMessageCircle,
  FiMaximize2,
  FiEye,
} from "react-icons/fi";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminStatementModal({
  isOpen,
  onClose,
}: StatementModalProps) {
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPaidFilter, setIsPaidFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);

  // Slider State for Order Details
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null);
  const [previewProof, setPreviewProof] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !statementData) {
      handleGenerateStatement();
    }
  }, [isOpen]);

  const setPreset = (type: string) => {
    const today = new Date();
    if (type === "today") {
      const d = format(today, "yyyy-MM-dd");
      setStartDate(d);
      setEndDate(d);
    } else if (type === "yesterday") {
      const y = format(subDays(today, 1), "yyyy-MM-dd");
      setStartDate(y);
      setEndDate(y);
    } else if (type === "this_week") {
      setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (type === "this_month") {
      setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (type === "last_30_days") {
      setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (type === "all_time") {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleGenerateStatement = async () => {
    setLoading(true);
    try {
      let paidVal: boolean | null = null;
      if (isPaidFilter === "PAID") paidVal = true;
      if (isPaidFilter === "UNPAID") paidVal = false;

      const res = await axios.post("/api/admin/statement", {
        startDate,
        endDate,
        status: statusFilter,
        isPaid: paidVal,
      });

      if (res.data?.success) {
        setStatementData(res.data);
        toast.success("Statement report ready!");
      }
    } catch (error: any) {
      console.error("Statement generation failed:", error);
      toast.error(error.response?.data?.error || "Failed to generate statement.");
    } finally {
      setLoading(false);
    }
  };

  // 100% Reliable Isolated Document Printer
  const handlePrint = () => {
    if (!statementData) return;

    const printWindow = window.open("", "_blank", "width=950,height=850");
    if (!printWindow) {
      window.print();
      return;
    }

    const periodText = `${
      startDate ? formatDate(startDate) : "Beginning"
    } — ${endDate ? formatDate(endDate) : "Present"}`;
    const generatedText = format(new Date(), "MMM dd, yyyy • hh:mm a");

    const rowsHtml = (statementData.orders || [])
      .map((order: any, idx: number) => {
        const itemsSummary = Array.isArray(order.orderItems)
          ? order.orderItems
              .map((i: any) => `${i.name} (x${i.quantity})`)
              .join(", ")
          : "N/A";

        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; color: #6b7280;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-weight: bold; color: #111827;">#${order._id.substring(0, 8)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; color: #374151;">${formatDate(order.createdAt)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: bold; color: #111827;">${order.shippingAddress?.fullName || order.user?.name || "Guest"}</div>
            <div style="font-size: 11px; color: #6b7280; font-family: monospace;">${order.shippingAddress?.phone || "N/A"}</div>
            ${order.shippingAddress?.city ? `<div style="font-size: 10px; color: #9ca3af;">${order.shippingAddress.city}</div>` : ""}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; max-width: 220px; color: #374151; font-size: 11px;">${itemsSummary}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase; ${
              order.isPaid
                ? "background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;"
                : "background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a;"
            }">
              ${order.isPaid ? "Paid" : "Pending"}
            </span>
            <div style="font-size: 10px; color: #9ca3af; margin-top: 3px; text-transform: uppercase;">${order.paymentMethod || "COD"}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; text-transform: capitalize; color: #374151;">${order.status}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827; white-space: nowrap;">${formatPrice(order.totalPrice)}</td>
        </tr>
      `;
      })
      .join("");

    const logoUrl = `${window.location.origin}/homyorganic.png`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Homy Organic - Sales Statement (${periodText})</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 15px; background: #ffffff; font-size: 12px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 15px; margin-bottom: 20px; }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand-title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: -0.5px; }
            .brand-subtitle { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; color: #B9853A; margin-top: 2px; }
            .title-area { text-align: right; }
            .title-area h2 { font-size: 16px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 800; }
            .title-area p { margin: 2px 0; color: #4b5563; font-size: 11px; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
            .metric-box { padding: 12px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; }
            .metric-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
            .metric-val { font-size: 16px; font-weight: bold; margin-top: 4px; color: #111827; }
            .metric-val.highlight { color: #B9853A; }
            .metric-val.green { color: #047857; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; color: #374151; }
            tr { page-break-inside: avoid; }
            .footer { border-top: 1px solid #e5e7eb; padding-top: 15px; display: flex; justify-content: space-between; color: #9ca3af; font-size: 10px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img src="${logoUrl}" height="48" style="height: 48px; width: auto; object-fit: contain;" />
              <div>
                <div class="brand-title">Homy Organic</div>
                <div class="brand-subtitle">Pure • Natural • Organic</div>
              </div>
            </div>
            <div class="title-area">
              <h2>Sales Financial Statement</h2>
              <p><strong>Period:</strong> ${periodText}</p>
              <p>Generated: ${generatedText}</p>
            </div>
          </div>

          <div class="metrics">
            <div class="metric-box">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-val highlight">${formatPrice(statementData.summary?.totalRevenue || 0)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Total Orders</div>
              <div class="metric-val">${statementData.summary?.totalOrders || 0}</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Delivered Orders</div>
              <div class="metric-val green">${statementData.summary?.deliveredOrders || 0}</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Items Sold</div>
              <div class="metric-val">${statementData.summary?.totalItemsSold || 0}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items Summary</th>
                <th>Payment</th>
                <th>Status</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="padding: 20px; text-align: center; color: #9ca3af;">No orders found matching filter criteria.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <div>Homy Organic — Official Financial Statement Document</div>
            <div>Authorized Admin System Generated Report</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const currentOrder =
    selectedOrderIndex !== null && statementData?.orders
      ? statementData.orders[selectedOrderIndex]
      : null;

  const handlePrevOrder = () => {
    if (selectedOrderIndex === null || !statementData?.orders) return;
    if (selectedOrderIndex > 0) {
      setSelectedOrderIndex(selectedOrderIndex - 1);
    }
  };

  const handleNextOrder = () => {
    if (selectedOrderIndex === null || !statementData?.orders) return;
    if (selectedOrderIndex < statementData.orders.length - 1) {
      setSelectedOrderIndex(selectedOrderIndex + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      {/* Modal Box */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Controls Bar */}
        <div className="bg-gray-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B9853A] text-white flex items-center justify-center shrink-0 font-bold">
              <FiFileText size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Sales & Financial Statement
              </h2>
              <p className="text-xs text-gray-400">
                Filter date range, click any order to slide through full details & print PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {statementData && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#B9853A] hover:bg-[#a3722e] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <FiPrinter size={16} />
                Print PDF Statement
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 space-y-4 shrink-0">
          
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] shrink-0">
              Presets:
            </span>
            {[
              { label: "Today", key: "today" },
              { label: "Yesterday", key: "yesterday" },
              { label: "This Week", key: "this_week" },
              { label: "This Month", key: "this_month" },
              { label: "Last 30 Days", key: "last_30_days" },
              { label: "All Time", key: "all_time" },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPreset(p.key)}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-black text-gray-700 font-medium transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date & Filter Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-black"
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Payment Status
                </label>
                <select
                  value={isPaidFilter}
                  onChange={(e) => setIsPaidFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Payments</option>
                  <option value="PAID">Paid Only</option>
                  <option value="UNPAID">Pending Only</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateStatement}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-black text-white font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer shrink-0 h-[38px] flex items-center gap-1.5"
              >
                <FiSearch size={14} />
                {loading ? "Filter..." : "Apply Filter"}
              </button>
            </div>
          </div>

        </div>

        {/* Statement On-Screen Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white" id="printable-statement">
          {loading ? (
            <div className="py-20 text-center text-gray-400 space-y-3">
              <div className="w-8 h-8 border-2 border-[#B9853A]/30 border-t-[#B9853A] rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Generating financial statement report...</p>
            </div>
          ) : !statementData ? (
            <div className="py-20 text-center text-gray-400">
              No statement data generated yet. Click "Apply Filter" to load report.
            </div>
          ) : (
            <div className="space-y-6 text-gray-800">
              
              {/* Report Official Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-gray-900 pb-6 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <img src="/homyorganic.png" alt="Logo" className="h-12 w-auto object-contain" />
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase font-serif">
                        Homy Organic
                      </h1>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B9853A]">
                        Pure • Natural • Organic
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs space-y-1">
                  <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                    Sales Financial Statement
                  </h2>
                  <p className="text-gray-600">
                    <span className="font-semibold">Statement Period: </span>
                    {startDate ? formatDate(startDate) : "Beginning"} — {endDate ? formatDate(endDate) : "Present"}
                  </p>
                  <p className="text-gray-400 text-[10px]">
                    Generated on {format(new Date(), "MMM dd, yyyy • hh:mm a")}
                  </p>
                </div>
              </div>

              {/* Summary Metrics Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales Revenue</p>
                  <p className="text-lg sm:text-xl font-bold text-[#B9853A] mt-1">
                    {formatPrice(statementData.summary?.totalRevenue || 0)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                    {statementData.summary?.totalOrders || 0}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivered Orders</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">
                    {statementData.summary?.deliveredOrders || 0}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Items Sold</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                    {statementData.summary?.totalItemsSold || 0}
                  </p>
                </div>
              </div>

              {/* Itemized Orders Table (Click Row to Open Order Slider!) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
                  <span>Filtered Orders ({statementData.orders?.length || 0})</span>
                  <span className="text-[#B9853A]">Click any order row to open detail slider →</span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider">
                        <th className="p-3">#</th>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer & Address</th>
                        <th className="p-3">Items Summary</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {statementData.orders?.map((order: any, idx: number) => {
                        const itemsSummary = Array.isArray(order.orderItems)
                          ? order.orderItems.map((i: any) => `${i.name} (x${i.quantity})`).join(", ")
                          : "N/A";

                        return (
                          <tr
                            key={order._id}
                            onClick={() => setSelectedOrderIndex(idx)}
                            className="hover:bg-[#B9853A]/10 transition-colors cursor-pointer group"
                            title="Click to view order details slider"
                          >
                            <td className="p-3 font-mono text-gray-400 align-top">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-gray-900 align-top group-hover:text-[#B9853A] transition-colors">
                              #{order._id.substring(0, 8)}
                            </td>
                            <td className="p-3 text-gray-600 whitespace-nowrap align-top">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="p-3 align-top">
                              <p className="font-bold text-gray-900">
                                {order.shippingAddress?.fullName || order.user?.name || "Guest"}
                              </p>
                              <p className="text-[11px] text-gray-500 font-mono">
                                {order.shippingAddress?.phone || "N/A"}
                              </p>
                              {order.shippingAddress?.city && (
                                <p className="text-[10px] text-gray-400">
                                  {order.shippingAddress.city}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-gray-700 max-w-xs align-top">
                              <p className="text-xs font-medium line-clamp-2" title={itemsSummary}>
                                {itemsSummary}
                              </p>
                            </td>
                            <td className="p-3 align-top">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                                  order.isPaid
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {order.isPaid ? "Paid" : "Pending"}
                              </span>
                              <p className="text-[10px] text-gray-400 mt-1 uppercase">
                                {order.paymentMethod || "COD"}
                              </p>
                            </td>
                            <td className="p-3 align-top">
                              <span className="capitalize font-semibold text-gray-800">
                                {order.status}
                              </span>
                            </td>
                            <td className="p-3 text-right align-top">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderIndex(idx);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-gray-100 group-hover:bg-[#B9853A] group-hover:text-white text-gray-700 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <FiEye size={13} />
                                Slide Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(!statementData.orders || statementData.orders.length === 0) && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-400">
                            No orders matched the selected filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Printable Sign-off Footer */}
              <div className="pt-8 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
                <p>Homy Organic — Official Financial Statement Report</p>
                <p>Authorized Admin System Generated Document</p>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Interactive Order Details Slider Drawer (Responsive Bottom Sheet on Mobile, Slide Drawer on Desktop) */}
      {currentOrder && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-end bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-full sm:max-w-2xl h-[94vh] sm:h-full rounded-t-3xl sm:rounded-none bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            
            {/* Slider Top Bar */}
            <div className="p-3.5 sm:p-5 bg-gray-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-[#B9853A] font-bold uppercase tracking-wider">
                    Order {selectedOrderIndex! + 1} of {statementData?.orders?.length}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="font-mono text-xs font-bold text-white truncate max-w-[120px] sm:max-w-none">
                    #{currentOrder._id}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Placed on {formatDate(currentOrder.createdAt)}
                </p>
              </div>

              {/* Navigation Arrows Slider Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrevOrder}
                  disabled={selectedOrderIndex! <= 0}
                  className="p-1.5 sm:p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Previous Order"
                >
                  <FiChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleNextOrder}
                  disabled={selectedOrderIndex! >= statementData.orders.length - 1}
                  className="p-1.5 sm:p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Next Order"
                >
                  <FiChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrderIndex(null)}
                  className="p-1.5 sm:p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer ml-1 sm:ml-2"
                  title="Close Slider"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Slider Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
              
              {/* Status & Price Banner */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Total Amount</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">
                    {formatPrice(currentOrder.totalPrice)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    currentOrder.status === "delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : currentOrder.status === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {currentOrder.status}
                </span>
              </div>

              {/* Products Carousel Slider */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiPackage className="text-[#B9853A]" />
                  Ordered Items ({currentOrder.orderItems?.length || 0})
                </h3>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {currentOrder.orderItems?.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="min-w-[200px] p-3 rounded-2xl border border-gray-200 bg-white space-y-2 shrink-0 shadow-2xs"
                    >
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiPackage className="w-8 h-8 text-gray-300 m-auto mt-10" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                        <p className="text-xs font-bold text-[#B9853A] mt-1">
                          Subtotal: {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Delivery Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FiMapPin className="text-[#B9853A]" />
                    Shipping Recipient
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {currentOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {currentOrder.shippingAddress?.address}
                  </p>
                  {currentOrder.shippingAddress?.city && (
                    <p className="text-xs text-gray-600">
                      {currentOrder.shippingAddress.city} {currentOrder.shippingAddress.postalCode}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FiPhone className="text-[#B9853A]" />
                    Customer Contact
                  </p>
                  <p className="text-xs text-gray-600 font-mono">
                    Phone: {currentOrder.shippingAddress?.phone}
                  </p>
                  <p className="text-xs text-gray-600 break-all">
                    Email: {currentOrder.contactEmail || currentOrder.user?.email || "N/A"}
                  </p>

                  {currentOrder.shippingAddress?.phone && (
                    <button
                      onClick={() => {
                        let num = currentOrder.shippingAddress.phone.replace(/[^0-9]/g, "");
                        if (num.startsWith("0")) num = "92" + num.slice(1);
                        else if (!num.startsWith("92")) num = "92" + num;
                        const msg = `Hi ${currentOrder.shippingAddress.fullName}, regarding order #${currentOrder._id.substring(0, 8)}...`;
                        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-emerald-200 mt-1"
                    >
                      <FiMessageCircle size={14} />
                      WhatsApp Customer
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Verification */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FiCreditCard className="text-[#B9853A]" />
                  Payment Status
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      currentOrder.isPaid
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {currentOrder.isPaid ? "Paid" : "Pending"}
                  </span>
                  <span className="text-xs text-gray-600 font-semibold">
                    Method: {currentOrder.paymentMethod}
                  </span>
                </div>

                {(currentOrder.paymentProofUrl || currentOrder.paymentProof) && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Payment Screenshot Proof:</p>
                    <div
                      onClick={() => setPreviewProof(currentOrder.paymentProofUrl || currentOrder.paymentProof)}
                      className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 cursor-pointer group bg-gray-50"
                    >
                      <img
                        src={currentOrder.paymentProofUrl || currentOrder.paymentProof}
                        alt="Payment Proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <FiMaximize2 size={18} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tracking ID if shipped */}
              {currentOrder.trackingNumber && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <FiTruck size={16} />
                    <span>Courier Tracking Code:</span>
                    <span className="font-mono font-bold">{currentOrder.trackingNumber}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentOrder.trackingNumber);
                      toast.success("Tracking code copied!");
                    }}
                    className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Full Screenshot Image View */}
      {previewProof && (
        <div
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setPreviewProof(null)}
        >
          <div className="relative max-w-3xl w-full bg-white rounded-2xl p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider">Payment Screenshot</h4>
              <button onClick={() => setPreviewProof(null)} className="p-1 text-gray-500 hover:text-black">
                <FiX size={18} />
              </button>
            </div>
            <img src={previewProof} alt="Full Proof" className="w-full max-h-[75vh] object-contain rounded-xl bg-gray-50" />
          </div>
        </div>
      )}

    </div>
  );
}
