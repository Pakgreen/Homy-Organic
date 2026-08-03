import type { Metadata } from "next";
import Link from "next/link";
import { FiTruck, FiClock, FiCheckCircle, FiDollarSign, FiHelpCircle, FiMessageCircle } from "react-icons/fi";
import Breadcrumb from "@/components/Breadcrumb";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homyorganic.store";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Homy Organic Store",
  description:
    "Everything you need to know about delivery charges, timelines, cash on delivery (COD), and tracking your Homy Organic order across Pakistan.",
  alternates: {
    canonical: `${siteUrl}/shipping-policy`,
  },
  openGraph: {
    title: "Shipping & Delivery Policy | Homy Organic Store",
    description:
      "Delivery charges, timelines, cash on delivery (COD), and order tracking across Pakistan.",
    url: `${siteUrl}/shipping-policy`,
    siteName: "Homy Organic",
    locale: "en_PK",
    type: "website",
  },
};

export default function ShippingPolicyPage() {
  const whatsappNumber = "923023735860";
  const whatsappMessage = encodeURIComponent("Hi Homy Organic Support, I have a query about my shipping/delivery.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ name: "Shipping Policy", url: "/shipping-policy" }]} />

        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-100 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F5EFE6] flex items-center justify-center text-[#B9853A]">
            <FiTruck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Shipping & Delivery Policy
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            Everything you need to know about how your Homy Organic order reaches you safely across Pakistan.
          </p>
        </div>

        {/* Section 1: Delivery Charges */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiDollarSign className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Delivery Charges
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            A flat delivery charge of <strong>Rs. 250</strong> applies to all orders across Pakistan.
          </p>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-3 text-sm text-emerald-900 font-semibold">
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>🎉 Orders above <strong>Rs. 5,000</strong> qualify for <strong>FREE Delivery</strong> nation-wide!</span>
          </div>
        </section>

        {/* Section 2: Delivery Timelines */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiClock className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Delivery Timelines
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200/70">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Major Cities</h3>
              <p className="text-gray-600 text-sm">2 - 4 Business Days</p>
              <span className="text-xs text-gray-400 mt-1 block">(Lahore, Karachi, Islamabad, Rawalpindi, Multan, etc.)</span>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200/70">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Other Cities & Towns</h3>
              <p className="text-gray-600 text-sm">3 - 6 Business Days</p>
              <span className="text-xs text-gray-400 mt-1 block">(All regional areas & remote districts)</span>
            </div>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm italic pt-1">
            * Orders are processed and dispatched within 24 - 48 hours of order confirmation on WhatsApp.
          </p>
        </section>

        {/* Section 3: Order Confirmation */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiCheckCircle className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Order Confirmation
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            Every order placed through checkout is confirmed with you over <strong>WhatsApp</strong> before dispatch.
          </p>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            Please keep your phone reachable so our team can quickly verify your delivery address and preferred payment method.
          </p>
        </section>

        {/* Section 4: Cash on Delivery (COD) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiTruck className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Cash on Delivery (COD) & Online Payment
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            <strong>Cash on Delivery (COD)</strong> is available on all orders nationwide.
          </p>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            You may also pay in advance via <strong>Easypaisa or JazzCash</strong> and share your payment screenshot on WhatsApp to speed up processing and dispatch.
          </p>
        </section>

        {/* Section 5: Delayed or Missing Orders */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiHelpCircle className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Delayed or Missing Orders
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            If your order hasn’t arrived within the expected timeline, message us on WhatsApp with your order ID and we will track it with our courier partner right away.
          </p>

          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] transition-all shadow-sm cursor-pointer"
            >
              <FiMessageCircle className="w-5 h-5" />
              <span>Track Order on WhatsApp</span>
            </a>
          </div>
        </section>

        {/* Footer Link back */}
        <div className="text-center pt-4">
          <Link
            href="/products"
            className="inline-flex items-center text-sm font-semibold text-[#B9853A] hover:underline"
          >
            ← Back to Storefront
          </Link>
        </div>

      </div>
    </div>
  );
}
