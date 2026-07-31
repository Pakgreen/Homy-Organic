"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  FiTruck,
  FiSearch,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPhone,
  FiCopy,
  FiArrowRight,
  FiAlertCircle,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface OrderData {
  _id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  totalPrice: number;
  shippingPrice: number;
  paymentMethod: string;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string;
  orderItems: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city?: string;
  };
}

const statusSteps = [
  { key: "pending", label: "Order Placed", desc: "We have received your order." },
  { key: "processing", label: "Processing", desc: "Your order is being prepared." },
  { key: "shipped", label: "Shipped", desc: "On the way via courier." },
  { key: "delivered", label: "Delivered", desc: "Successfully delivered." },
];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId.trim() && !phone.trim()) {
      toast.error("Please enter an Order ID or Phone Number.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const res = await axios.post("/api/orders/track", {
        orderId: orderId.trim(),
        phone: phone.trim(),
      });

      if (res.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
        setErrorMsg("No orders found for the given details.");
      }
    } catch (err: any) {
      console.error("Track order error:", err);
      setOrders([]);
      setErrorMsg(
        err.response?.data?.error ||
          "No order found. Please check your Order ID or Phone Number."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}!`);
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "processing":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#B9853A]/10 text-[#B9853A] mb-1">
            <FiTruck size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 uppercase font-serif">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto font-light">
            Enter your Order ID or Phone Number below to get instant live status of your shipment.
          </p>
        </div>

        {/* Search Input Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 65f3a..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-black transition-colors bg-gray-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 03023735860"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-black transition-colors bg-gray-50/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Tracking Order...
                </>
              ) : (
                <>
                  <FiSearch size={18} />
                  Track Order Now
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-sm">
            <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Section */}
        {searched && !loading && orders.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-900 text-center">
              Found {orders.length} Order(s)
            </h2>

            {orders.map((order) => {
              const currentStepIdx = getStepIndex(order.status);
              const isCancelled = order.status === "cancelled";

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Order ID:
                        </span>
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {order._id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order._id, "Order ID")}
                          className="text-gray-400 hover:text-black transition-colors"
                          title="Copy Order ID"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-gray-900">
                        {formatPrice(order.totalPrice)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-100 text-red-700"
                            : order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Status Timeline Stepper */}
                  {isCancelled ? (
                    <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 flex items-center gap-3 text-sm font-medium">
                      <FiXCircle size={20} />
                      This order has been cancelled. Please contact support if you need assistance.
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {statusSteps.map((step, idx) => {
                          const isPassed = currentStepIdx >= idx;
                          const isCurrent = currentStepIdx === idx;

                          return (
                            <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  isPassed
                                    ? "bg-[#B9853A] text-white shadow-md shadow-[#B9853A]/30"
                                    : "bg-gray-100 text-gray-400"
                                } ${isCurrent ? "ring-4 ring-[#B9853A]/20 scale-110" : ""}`}
                              >
                                {isPassed ? <FiCheckCircle size={18} /> : idx + 1}
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${isPassed ? "text-gray-900" : "text-gray-400"}`}>
                                  {step.label}
                                </p>
                                <p className="text-[10px] text-gray-400 font-light hidden sm:block mt-0.5">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tracking Number if shipped */}
                  {order.trackingNumber && (
                    <div className="p-4 rounded-2xl bg-[#B9853A]/10 border border-[#B9853A]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <FiTruck className="text-[#B9853A]" size={18} />
                        <span className="font-semibold text-gray-900">
                          Courier Tracking Number:
                        </span>
                        <span className="font-mono font-bold text-[#B9853A]">
                          {order.trackingNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(order.trackingNumber!, "Tracking Number")}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#B9853A]/30 text-xs font-medium text-[#B9853A] hover:bg-[#B9853A] hover:text-white transition-all cursor-pointer"
                      >
                        Copy Tracking Code
                      </button>
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Ordered Items ({order.orderItems?.length || 0})
                    </h3>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                      {order.orderItems?.map((item, i) => (
                        <div key={i} className="p-3 sm:p-4 flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FiPackage className="w-6 h-6 text-gray-400 m-auto" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Qty: {item.quantity} × {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer & Shipping Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                      <p className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <FiMapPin className="text-[#B9853A]" />
                        Shipping Destination
                      </p>
                      <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                      <p className="text-gray-600">{order.shippingAddress?.address}</p>
                      {order.shippingAddress?.city && (
                        <p className="text-gray-600">{order.shippingAddress.city}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                      <p className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <FiPhone className="text-[#B9853A]" />
                        Contact & Payment
                      </p>
                      <p className="text-gray-600">Phone: {order.shippingAddress?.phone}</p>
                      <p className="text-gray-600">Payment: {order.paymentMethod}</p>
                      <p className="text-gray-600 font-semibold">
                        Status: {order.isPaid ? "Paid" : "Cash on Delivery / Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
