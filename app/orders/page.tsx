"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/auth/signin?callbackUrl=/orders");
      return;
    }

    fetchOrders();
  }, [status, session, router]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      // Handle both formats: array directly or object with orders property
      const data = Array.isArray(res.data) ? res.data : res.data.orders || [];
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setErrorMessage(
        "Unable to load your orders right now. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {errorMessage && (
        <div className="mb-4 text-red-600 text-sm">{errorMessage}</div>
      )}

      {orders.length > 0 ? (
        <div className="space-y-10">
          {orders.map((order: any) => (
            <div
              key={order._id}
              className="pb-10 pt-4 border-b border-gray-200 last:border-0"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <Link
                    href={`/orders/${order._id}`}
                    className="group hover:opacity-80 transition-opacity inline-block"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      Order #{order._id.slice(-8).toUpperCase()}
                      <svg
                        className="w-5 h-5 text-gray-400 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </h2>
                  </Link>
                  <p className="text-sm text-gray-500 mb-3">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                  <div className="flex items-center space-x-4 text-sm font-medium">
                    <span className="text-gray-600">
                      Status:{" "}
                      <span className="text-gray-900">
                        {ORDER_STATUS_LABELS[
                          order.status as keyof typeof ORDER_STATUS_LABELS
                        ] || order.status}
                      </span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">
                      Payment:{" "}
                      <span
                        className={
                          order.isPaid ? "text-green-600" : "text-gray-900"
                        }
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">
                      Method:{" "}
                      <span className="text-gray-900">
                        {order.paymentMethod || "Cash on Delivery"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
                    Order Total
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    {formatPrice(order.totalPrice)}
                  </p>
                </div>
              </div>

              <div>
                <div className="space-y-4">
                  {order.orderItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start justify-between"
                    >
                      <div className="flex items-start space-x-4">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-50 flex items-center justify-center border border-gray-100">
                            <span className="text-gray-400 text-[10px] uppercase">
                              No img
                            </span>
                          </div>
                        )}
                        <div className="pt-1">
                          <Link
                            href={`/products/${item.product || ""}`}
                            className="font-medium text-base text-gray-900 hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">
                            Qty:{" "}
                            <span className="text-gray-900">
                              {item.quantity}
                            </span>
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-base text-gray-900 pt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-start sm:justify-end">
                <Link
                  href={`/orders/${order._id}`}
                  className="inline-flex items-center text-sm font-semibold text-gray-900 hover:text-(--primary-color) transition-colors group"
                >
                  View Order Details
                  <svg
                    className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            You haven't placed any orders yet.
          </p>
          <Link href="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
