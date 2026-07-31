"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  FiCopy,
  FiMessageCircle,
  FiPackage,
  FiUser,
  FiCreditCard,
  FiMapPin,
  FiTruck,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMaximize2,
  FiX,
} from "react-icons/fi";
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchOrder();
    }
  }, [params?.id]);

  const fetchOrder = async () => {
    const id = params?.id;
    if (!id) return;
    try {
      const res = await axios.get(`/api/orders/${id}`);
      const data = res.data;
      setOrder(data);
      setStatus(data.status);
      setTrackingNumber(data.trackingNumber || "");
      setIsPaid(data.isPaid);

      const refFallback =
        data.paymentReference ||
        data.paymentTid ||
        data.paymentId ||
        data.transactionId ||
        "";
      const proofFallback = data.paymentProofUrl || data.paymentProof || "";
      setPaymentRef(refFallback);
      setPaymentProof(proofFallback);
    } catch (error) {
      toast.error("Failed to fetch order details");
    }
  };

  const handleUpdate = async () => {
    const id = params?.id;
    if (!id) return;
    setUpdating(true);
    try {
      await axios.put(`/api/orders/${id}`, {
        status,
        trackingNumber,
        isPaid,
      });
      toast.success("Order updated successfully!");
      fetchOrder();
    } catch (error) {
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadProof = async () => {
    if (!paymentProof) return;
    try {
      setIsDownloading(true);
      const response = await fetch(paymentProof);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment-proof-${order?._id || "order"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Could not download proof. Try opening the image.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 space-y-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading order details...</p>
      </div>
    );
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-mono tracking-tight">
              Order #{order._id}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(order._id);
              toast.success("Order ID copied!");
            }}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FiCopy size={14} />
            Copy Order ID
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Details Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Customer & Order Overview */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FiUser className="text-[#B9853A]" />
              Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Customer Name</p>
                <p className="font-semibold text-gray-900">{order.user?.name || order.shippingAddress?.fullName || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Customer Email</p>
                <p className="font-medium text-gray-900 break-all">{order.user?.email || order.contactEmail || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Phone Number</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{order.shippingAddress?.phone || "N/A"}</span>
                  {order.shippingAddress?.phone && (
                    <button
                      onClick={() => {
                        let num = order.shippingAddress.phone.replace(/[^0-9]/g, "");
                        if (num.startsWith("0")) num = "92" + num.slice(1);
                        else if (!num.startsWith("92")) num = "92" + num;
                        const msg = `Hi ${order.shippingAddress.fullName}, regarding your order #${order._id.substring(0, 8)} at Homy Organic...`;
                        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200"
                      title="Send WhatsApp Message"
                    >
                      <FiMessageCircle size={13} />
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Payment Method</p>
                <p className="font-semibold text-gray-900 uppercase">{order.paymentMethod || "JazzCash"}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Payment Verification */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FiCreditCard className="text-[#B9853A]" />
              Payment Verification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-xs text-gray-400 font-medium">Payment Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase mt-1 border ${
                    order.isPaid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${order.isPaid ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {order.isPaid ? "Paid" : "Pending Payment"}
                </span>
              </div>

              {paymentRef && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">Transaction Reference / TID</p>
                  <p className="font-mono text-sm font-bold text-gray-900 mt-1 break-all">{paymentRef}</p>
                </div>
              )}
            </div>

            {/* Payment Proof Screenshot */}
            {paymentProof ? (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-700">Payment Screenshot</p>
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => setIsModalOpen(true)}
                    className="relative group w-36 h-36 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer"
                  >
                    <img
                      src={paymentProof}
                      alt="Payment Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <FiMaximize2 size={20} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadProof}
                    disabled={isDownloading}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiDownload size={14} />
                    {isDownloading ? "Downloading..." : "Download Screenshot"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gray-50 text-gray-500 text-xs font-light">
                No payment screenshot uploaded for this order.
              </div>
            )}
          </div>

          {/* Card 3: Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <FiMapPin className="text-[#B9853A]" />
                Shipping Address
              </h2>

              <button
                onClick={() => {
                  const details = `${order.shippingAddress?.fullName}\n${order.shippingAddress?.address}\n${order.shippingAddress?.city}, ${order.shippingAddress?.postalCode}\nPhone: ${order.shippingAddress?.phone}`;
                  navigator.clipboard.writeText(details);
                  toast.success("Full shipping address copied!");
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Copy Address
              </button>
            </div>

            <div className="text-xs sm:text-sm space-y-1.5 text-gray-700">
              <p className="font-bold text-gray-900 text-base">{order.shippingAddress?.fullName}</p>
              <p className="leading-relaxed">{order.shippingAddress?.address}</p>
              <p className="font-medium text-gray-800">{order.shippingAddress?.city} {order.shippingAddress?.postalCode}</p>
              <p className="text-gray-500 pt-1 font-mono">Phone: {order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Card 4: Ordered Items */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FiPackage className="text-[#B9853A]" />
              Ordered Items ({order.orderItems?.length || 0})
            </h2>

            <div className="divide-y divide-gray-100">
              {order.orderItems?.map((item: any, idx: number) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiPackage className="w-6 h-6 text-gray-300 m-auto mt-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>

                  <div className="font-bold text-gray-900 text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Update Controls & Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 5: Update Order Controls */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FiTruck className="text-[#B9853A]" />
              Update Order
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-black transition-colors"
                >
                  <option value={ORDER_STATUS.PENDING}>Pending</option>
                  <option value={ORDER_STATUS.PROCESSING}>Processing</option>
                  <option value={ORDER_STATUS.SHIPPED}>Shipped</option>
                  <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
                  <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Courier Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking ID"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider group-hover:text-black">
                    Mark Order as Paid
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                className="w-full py-3 px-4 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {updating ? "Updating..." : "Save Order Changes"}
              </button>
            </div>
          </div>

          {/* Card 6: Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.itemsPrice || 0)}</span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Shipping Fee</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.shippingPrice || 0)}</span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Tax</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.taxPrice || 0)}</span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-base font-bold text-gray-900">
                <span>Total Amount</span>
                <span className="text-[#B9853A] text-lg">{formatPrice(order.totalPrice || 0)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Screenshot Modal View */}
      {isModalOpen && paymentProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900">Payment Screenshot Proof</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>
            <img
              src={paymentProof}
              alt="Payment proof full"
              className="w-full max-h-[75vh] object-contain rounded-xl bg-gray-50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
