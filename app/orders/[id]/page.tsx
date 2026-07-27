"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchOrder();
    }
  }, [params?.id]);

  const fetchOrder = async () => {
    try {
      const id = params?.id;
      if (!id) return;
      const res = await axios.get(`/api/orders/${id}`);
      setOrder(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(
        err?.response?.data?.error ||
          "Order not found or you don't have permission to view it.",
      );
    }
  };

  if (error)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="bg-red-50 text-red-600 rounded-xl p-8 border border-red-100">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Link
            href="/orders"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Return to Orders
          </Link>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "var(--primary-color, #000000)" }}
        ></div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link
        href="/orders"
        className="group inline-flex items-center text-sm font-medium hover:opacity-80 transition-opacity mb-6"
        style={{ color: "var(--primary-color, #000000)" }}
      >
        <svg
          className="w-5 h-5 mr-1.5 transition-transform group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Order Details
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-sm ring-1 ring-inset ${
            ORDER_STATUS_COLORS[
              order.status as keyof typeof ORDER_STATUS_COLORS
            ]
          } ring-current/20`}
        >
          {ORDER_STATUS_LABELS[
            order.status as keyof typeof ORDER_STATUS_LABELS
          ] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Items & Order Summary */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Order Items</h3>
            </div>
            <div className="px-6 py-2">
              <div className="divide-y divide-gray-100">
                {order.orderItems.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-4 group"
                  >
                    <div className="flex items-center space-x-4">
                      {item.image ? (
                        <div className="relative w-16 h-16 shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl border border-gray-100 shadow-sm"
                          />
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white ring-2 ring-white">
                            {item.quantity}
                          </span>
                        </div>
                      ) : (
                        <div className="relative w-16 h-16 shrink-0 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                          <span className="text-gray-400 text-xs font-medium">
                            No img
                          </span>
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white ring-2 ring-white">
                            {item.quantity}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[var(--primary-color)] transition-colors">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 ml-4">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50/50 px-6 py-5 border-t border-gray-100">
              <div className="space-y-3 pb-3 border-b border-gray-100/80 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.itemsPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Tax</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.taxPrice)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span
                  className="text-2xl font-black tracking-tight"
                  style={{ color: "var(--primary-color, #000000)" }}
                >
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Payment */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Payment Status</h3>
              <span className="text-gray-600 font-medium">
                {order.isPaid ? "Paid" : "Pending"}
              </span>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Method
                </p>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    ></path>
                  </svg>
                  <p className="font-semibold text-gray-900">
                    {order.paymentMethod || "Cash on Delivery"}
                  </p>
                </div>
              </div>

              {order.paymentReference && (
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    Transaction ID
                  </p>
                  <p className="font-mono text-sm font-medium text-gray-900 break-all">
                    {order.paymentReference}
                  </p>
                </div>
              )}

              {order.paymentProofUrl && (
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                    Payment Proof Reference
                  </p>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative group overflow-hidden rounded-xl border border-gray-200"
                  >
                    <img
                      src={order.paymentProofUrl}
                      alt="Payment proof"
                      className="w-full h-32 object-cover bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-sm font-medium flex items-center">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          ></path>
                        </svg>
                        View Proof
                      </span>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                Delivery Target
              </h3>
            </div>
            <div className="px-6 py-5">
              <p className="font-semibold text-gray-900 mb-1">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Contact Phone
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {order.shippingAddress.phone}
                </p>
              </div>

              {order.trackingNumber && (
                <div className="mt-4 pt-4 border-t border-gray-50 bg-blue-50/50 -mx-6 px-6 -mb-5 pb-5">
                  <p className="text-xs text-blue-600/80 uppercase tracking-wider font-bold mb-1">
                    Tracking Number
                  </p>
                  <div className="flex items-center">
                    <p className="font-mono text-lg font-bold text-blue-900 tracking-wider">
                      {order.trackingNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
