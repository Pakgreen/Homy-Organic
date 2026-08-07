"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { FiPrinter, FiX } from "react-icons/fi";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site.config";

interface CourierShippingSlipProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourierShippingSlip({
  order,
  isOpen,
  onClose,
}: CourierShippingSlipProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const shortId = order._id ? String(order._id).substring(0, 8).toUpperCase() : "N/A";
  const customerName = order.shippingAddress?.fullName || order.user?.name || "Customer";
  const customerPhone = order.shippingAddress?.phone || "N/A";
  const customerAddress = order.shippingAddress?.address || "N/A";
  const customerCity = order.shippingAddress?.city || "N/A";
  const customerPostalCode = order.shippingAddress?.postalCode || "";
  const paymentMethod = order.paymentMethod ? String(order.paymentMethod).toUpperCase() : "COD";
  const isPaid = order.isPaid;
  const storePhone = siteConfig?.contact?.phone || "+92 302 3735860";
  const storeEmail = siteConfig?.contact?.email || "info@homyorganic.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homyorganic.store";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92dvh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Header Controls (Hidden during Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50 print:hidden shrink-0">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Order Slip / Invoice
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <FiPrinter size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Printable Minimal Slip Area */}
        <div
          ref={slipRef}
          className="p-6 overflow-y-auto space-y-4 text-gray-900 print:p-4 print:overflow-visible"
          id="courier-slip-printable"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/homyorganic.png"
                alt="Homy Organic Logo"
                width={36}
                height={36}
                className="w-9 h-9 object-contain shrink-0"
              />
              <div>
                <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">
                  Homy Organic Store
                </h1>
                <p className="text-[10px] text-gray-500 font-mono">
                  {storePhone} • {storeEmail}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-300">
                #{shortId}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(order.createdAt || Date.now()).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Customer / Shipping Address Box */}
          <div className="border border-gray-300 rounded-xl p-3 bg-gray-50/60 text-xs space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Deliver To:
            </p>
            <p className="font-bold text-gray-900 text-sm">{customerName}</p>
            <p className="text-gray-800 leading-snug">{customerAddress}</p>
            <p className="text-gray-800 font-semibold">{customerCity} {customerPostalCode}</p>
            <p className="text-gray-900 font-mono font-bold pt-0.5">Phone: {customerPhone}</p>
          </div>

          {/* Minimal Items Table */}
          <div>
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-left font-bold uppercase text-[10px]">
                  <th className="p-2 border-r border-gray-200">Item</th>
                  <th className="p-2 border-r border-gray-200 w-12 text-center">Qty</th>
                  <th className="p-2 text-right w-20">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.orderItems?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-gray-200 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="p-2 border-r border-gray-200 text-center font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          <div className="border border-gray-900 rounded-xl p-3 bg-white flex items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Payment Method
              </p>
              <p className="font-bold text-gray-900 uppercase">
                {paymentMethod} {isPaid ? "(Paid)" : "(Unpaid/COD)"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Amount
              </p>
              <p className="text-lg font-mono font-extrabold text-gray-900">
                {formatPrice(order.totalPrice || 0)}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Embedded CSS for Print Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #courier-slip-printable, #courier-slip-printable * {
            visibility: visible;
          }
          #courier-slip-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 12px;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
