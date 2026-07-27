"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS,
} from "@/lib/constants";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      // Handle both formats: array directly or object with orders property
      const data = Array.isArray(res.data) ? res.data : res.data.orders || [];
      setOrders(data);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-gray-500 text-sm">
        <span className="flex items-center gap-3">
          <svg
            className="animate-spin h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading orders...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6 w-full">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Orders
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-light">
            Manage and track all store orders
          </p>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
            Total count:{" "}
            <span className="text-gray-900 ml-1">{orders.length}</span>
          </p>
          <button
            aria-label="Refresh orders"
            onClick={async () => {
              setIsLoading(true);
              await fetchOrders();
            }}
            className="text-xs uppercase tracking-widest font-medium text-gray-400 hover:text-black border-b border-transparent hover:border-black transition-colors cursor-pointer pb-0.5"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="w-full">
        <div className="overflow-x-auto">
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
                <th className="pb-4 px-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Payment
                </th>
                <th className="pb-4 pl-6 text-right text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order: any) => (
                <tr
                  key={order._id}
                  className="group transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30"
                >
                  <td className="py-5 pr-6 font-mono text-gray-500 tracking-tight text-xs">
                    #{order._id.slice(-8)}
                  </td>
                  <td className="py-5 px-6">
                    <div>
                      <p className="font-light text-gray-900 text-sm">
                        {order.user?.name || "Guest"}
                      </p>
                      <p className="text-xs text-gray-400 font-light mt-0.5">
                        {order.user?.email || "N/A"}
                      </p>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-gray-500 text-sm font-light whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-5 px-6 text-gray-900 text-sm font-medium">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="py-5 px-6">
                    <span
                      className={`px-2 py-0.5 inline-flex text-[10px] uppercase tracking-wider font-semibold border ${
                        ORDER_STATUS_COLORS[
                          order.status as keyof typeof ORDER_STATUS_COLORS
                        ] || "text-gray-600 border-gray-200"
                      }`}
                    >
                      {
                        ORDER_STATUS_LABELS[
                          order.status as keyof typeof ORDER_STATUS_LABELS
                        ]
                      }
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span
                      className={`px-2 py-0.5 inline-flex text-[10px] uppercase tracking-wider font-semibold border ${
                        order.isPaid
                          ? "border-green-200 text-green-700"
                          : "border-yellow-200 text-yellow-700"
                      }`}
                    >
                      {order.isPaid ? "Paid" : "Pending"}
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
            </tbody>
          </table>

          {orders.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <p className="text-sm font-light text-gray-500">
                No orders found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
