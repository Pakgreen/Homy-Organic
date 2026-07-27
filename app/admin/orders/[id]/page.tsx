"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { formatPrice, formatDate } from "@/lib/utils";
import { FiCopy, FiMessageCircle } from "react-icons/fi";
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
      toast.error("Failed to fetch order");
    }
  };

  const handleUpdate = async () => {
    const id = params?.id;
    if (!id) return;
    try {
      await axios.put(`/api/orders/${id}`, {
        status,
        trackingNumber,
        isPaid,
      });
      toast.success("Order updated successfully");
      fetchOrder();
    } catch (error) {
      toast.error("Failed to update order");
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

  if (!order)
    return (
      <div className="text-xs font-light uppercase tracking-widest text-gray-500 min-h-screen pt-24 text-center">
        Loading order details...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto pb-24 overflow-x-hidden sm:overflow-visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6 mb-12">
        <div className="min-w-0">
          <h2 className="text-xl font-light text-gray-900 uppercase tracking-widest break-all">
            Order{" "}
            <span className="font-semibold">
              {order._id.substring(0, 8)}...
            </span>
          </h2>
          <p className="mt-2 text-xs text-gray-400 uppercase tracking-widest">
            PLACED ON {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Order Info */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">
              Order Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <div className="flex flex-col items-start gap-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  Order ID
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order._id || "");
                    toast.success("Order ID copied!");
                  }}
                  className="group flex items-center gap-2 font-mono text-left cursor-pointer hover:text-black focus:outline-none transition-colors"
                  title="Click to copy Order ID"
                >
                  <span className="text-sm font-light text-gray-900 break-all">
                    {order._id}
                  </span>
                  <FiCopy
                    className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity shrink-0"
                    size={12}
                  />
                </button>
              </div>
              <div className="flex flex-col items-start gap-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  Date
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      formatDate(order.createdAt) || "",
                    );
                    toast.success("Date copied!");
                  }}
                  className="group flex items-center gap-2 text-left cursor-pointer hover:text-black focus:outline-none transition-colors"
                  title="Click to copy Date"
                >
                  <span className="text-sm font-light text-gray-900">
                    {formatDate(order.createdAt)}
                  </span>
                  <FiCopy
                    className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity"
                    size={12}
                  />
                </button>
              </div>
              <div className="flex flex-col items-start gap-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  Customer
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.user?.name || "");
                    toast.success("Customer name copied!");
                  }}
                  className="group flex items-center gap-2 font-medium text-left cursor-pointer hover:text-black focus:outline-none transition-colors"
                  title="Click to copy Name"
                >
                  <span className="text-sm text-gray-900 uppercase tracking-widest">
                    {order.user?.name}
                  </span>
                  <FiCopy
                    className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity"
                    size={12}
                  />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.user?.email || "");
                    toast.success("Customer email copied!");
                  }}
                  className="group flex items-center gap-2 text-sm text-gray-500 font-light text-left cursor-pointer hover:text-black focus:outline-none transition-colors mt-0.5"
                  title="Click to copy Email"
                >
                  <span className="break-all">{order.user?.email}</span>
                  <FiCopy
                    className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity shrink-0"
                    size={12}
                  />
                </button>
              </div>
              <div className="flex flex-col items-start gap-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  Payment Method
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.paymentMethod || "");
                    toast.success("Payment method copied!");
                  }}
                  className="group flex items-center gap-2 text-left cursor-pointer hover:text-black focus:outline-none transition-colors"
                  title="Click to copy Payment Method"
                >
                  <span className="text-sm font-light text-gray-900 uppercase tracking-wider">
                    {order.paymentMethod}
                  </span>
                  <FiCopy
                    className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity"
                    size={12}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Payment Proof */}
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">
              Payment Verification
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">
                  Paid Status
                </p>
                <p
                  className={`text-xs uppercase tracking-widest font-medium ${
                    order.isPaid ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {order.isPaid ? "Paid" : "Pending"}
                </p>
              </div>
              {paymentRef && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">
                    Transaction ID
                  </p>
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {paymentRef}
                  </p>
                </div>
              )}
              {paymentProof ? (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">
                    Payment Screenshot
                  </p>
                  <img
                    src={paymentProof}
                    alt="Payment proof"
                    onClick={() => setIsModalOpen(true)}
                    className="w-48 h-48 object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity bg-gray-50"
                    title="Click to view full size"
                  />
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleDownloadProof}
                      disabled={isDownloading}
                      className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-black border-b border-transparent hover:border-black cursor-pointer font-medium disabled:opacity-60 pb-0.5 transition-all"
                    >
                      {isDownloading
                        ? "DOWNLOADING..."
                        : "DOWNLOAD PAYMENT PROOF"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-light text-gray-500">
                  No payment screenshot uploaded.
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-b border-gray-100 pb-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                Shipping Address
              </h3>
              <button
                onClick={() => {
                  const details = `${order.shippingAddress.fullName}\n${order.shippingAddress.address}\n${order.shippingAddress.city}, ${order.shippingAddress.postalCode}\n${order.shippingAddress.country}\nPhone: ${order.shippingAddress.phone}`;
                  navigator.clipboard.writeText(details);
                  toast.success("Shipping details copied!");
                }}
                className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-black border border-gray-200 hover:border-black px-3 py-1 cursor-pointer transition-colors"
                title="Copy full shipping details"
              >
                Copy All
              </button>
            </div>
            <div className="flex flex-col items-start gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    order.shippingAddress.fullName || "",
                  );
                  toast.success("Name copied!");
                }}
                className="group flex items-center gap-2 text-left cursor-pointer hover:text-black focus:outline-none transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 uppercase tracking-widest">
                  {order.shippingAddress.fullName}
                </span>
                <FiCopy
                  className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity"
                  size={12}
                />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    order.shippingAddress.address || "",
                  );
                  toast.success("Address copied!");
                }}
                className="group flex items-center gap-2 text-left cursor-pointer hover:text-black focus:outline-none transition-colors max-w-full"
              >
                <span className="text-sm font-light text-gray-600 break-words">
                  {order.shippingAddress.address}
                </span>
                <FiCopy
                  className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity shrink-0"
                  size={12}
                />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`,
                  );
                  toast.success("City/Postal copied!");
                }}
                className="group flex items-center gap-2 text-left cursor-pointer hover:text-black focus:outline-none transition-colors max-w-full"
              >
                <span className="text-sm font-light text-gray-600 break-words">
                  {order.shippingAddress.city},{" "}
                  {order.shippingAddress.postalCode}
                </span>
                <FiCopy
                  className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity shrink-0"
                  size={12}
                />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    order.shippingAddress.country || "",
                  );
                  toast.success("Country copied!");
                }}
                className="group flex items-center gap-2 text-left cursor-pointer hover:text-black focus:outline-none transition-colors"
              >
                <span className="text-sm font-light text-gray-600 uppercase tracking-widest">
                  {order.shippingAddress.country}
                </span>
                <FiCopy
                  className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity"
                  size={12}
                />
              </button>
              <p className="text-gray-400 text-[10px] uppercase font-light flex items-center gap-2 mt-2 break-all flex-wrap">
                PHONE:
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.shippingAddress.phone);
                    toast.success("Phone number copied!");
                  }}
                  className="group flex items-center gap-2 font-medium text-gray-900 hover:text-black cursor-pointer transition-colors focus:outline-none text-sm normal-case tracking-normal"
                  title="Click to copy"
                >
                  <span>{order.shippingAddress.phone}</span>
                  <FiCopy
                    className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity"
                    size={12}
                  />
                </button>
                <button
                  onClick={() => {
                    if (!order.shippingAddress.phone) return;
                    let num = order.shippingAddress.phone.replace(
                      /[^0-9]/g,
                      "",
                    );
                    if (num.startsWith("0")) num = "92" + num.slice(1);
                    else if (!num.startsWith("92")) num = "92" + num; // default to pk format if missing code

                    const introText = `Your order (${order._id.substring(0, 8)}) has been placed successfully. It will be delivered to you in 2 to 3 working days. Thank you for shopping with us! If you did not purchase this order, please contact us at ${window.location.origin}/contact`;
                    const url = `https://wa.me/${num}?text=${encodeURIComponent(introText)}`;
                    window.open(url, "_blank");
                  }}
                  className="ml-2 group flex items-center gap-1.5 font-medium text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded-sm cursor-pointer transition-colors focus:outline-none text-xs uppercase tracking-widest border border-green-200 hover:border-green-300"
                  title="Message on WhatsApp"
                >
                  <FiMessageCircle size={14} />
                  <span>WhatsApp</span>
                </button>
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="pb-8">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">
              Order Items
            </h3>
            <div className="space-y-6">
              {order.orderItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6 last:border-b-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover border border-gray-100 mix-blend-multiply bg-gray-50"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 text-[10px] uppercase tracking-widest">
                        No Img
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-light text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                        QTY: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Update Order & Summary */}
        <div className="space-y-12 shrink-0 w-full lg:w-auto">
          <div className="border border-gray-200 p-6 bg-gray-50/30">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">
              Update Order
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-gray-900 uppercase tracking-widest mb-2">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 font-light appearance-none text-gray-900"
                >
                  <option value={ORDER_STATUS.PENDING}>Pending</option>
                  <option value={ORDER_STATUS.PROCESSING}>Processing</option>
                  <option value={ORDER_STATUS.SHIPPED}>Shipped</option>
                  <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
                  <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-900 uppercase tracking-widest mb-3">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 placeholder:text-gray-300 font-light"
                  placeholder="Enter tracking number"
                />
              </div>

              <div className="pt-2 flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="peer sr-opacity w-4 h-4 opacity-0 absolute"
                    />
                    <div className="w-4 h-4 border border-gray-300 rounded-sm bg-transparent peer-checked:bg-black peer-checked:border-black transition-colors flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white hidden peer-checked:block pointer-events-none"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M3 8L6 11L11 3.5"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          stroke="currentColor"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest group-hover:text-black">
                    Mark As Paid
                  </span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleUpdate}
                  className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Update Order
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">
              Order Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-light">
                <span className="text-gray-500 uppercase tracking-wider text-[10px]">
                  Subtotal
                </span>
                <span className="text-gray-900">
                  {formatPrice(order.itemsPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-light">
                <span className="text-gray-500 uppercase tracking-wider text-[10px]">
                  Shipping
                </span>
                <span className="text-gray-900">
                  {formatPrice(order.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-light">
                <span className="text-gray-500 uppercase tracking-wider text-[10px]">
                  Tax
                </span>
                <span className="text-gray-900">
                  {formatPrice(order.taxPrice)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Total
                </span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isModalOpen && paymentProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full flex flex-col justify-center items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-end mb-6">
              <button
                className="text-gray-400 hover:text-black uppercase tracking-widest text-[10px] font-semibold transition-colors cursor-pointer"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
            <img
              src={paymentProof}
              alt="Payment proof full"
              className="w-full h-auto max-h-[85vh] object-contain border border-gray-200 bg-gray-50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
