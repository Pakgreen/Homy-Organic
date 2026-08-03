import type { Metadata } from "next";
import Link from "next/link";
import { FiRefreshCw, FiAlertCircle, FiCheckCircle, FiMessageCircle, FiCreditCard, FiTruck } from "react-icons/fi";
import Breadcrumb from "@/components/Breadcrumb";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homyorganic.store";

export const metadata: Metadata = {
  title: "Return & Exchange Policy | Homy Organic Store",
  description:
    "Learn about Homy Organic's return & exchange policy for damaged, wrong, or defective orders. Guidelines on eligibility, refunds, and return shipping.",
  alternates: {
    canonical: `${siteUrl}/return-policy`,
  },
  openGraph: {
    title: "Return & Exchange Policy | Homy Organic Store",
    description:
      "Learn about Homy Organic's return & exchange policy for damaged, wrong, or defective orders.",
    url: `${siteUrl}/return-policy`,
    siteName: "Homy Organic",
    locale: "en_PK",
    type: "website",
  },
};

export default function ReturnPolicyPage() {
  const whatsappNumber = "923023735860";
  const whatsappMessage = encodeURIComponent("Hi Homy Organic Support, I need help with a Return/Exchange for my order.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ name: "Return Policy", url: "/return-policy" }]} />

        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-100 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F5EFE6] flex items-center justify-center text-[#B9853A]">
            <FiRefreshCw className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Return & Exchange Policy
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            How we handle damaged, wrong, or defective Homy Organic orders to ensure your complete peace of mind.
          </p>
        </div>

        {/* Section 1: Eligibility */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiCheckCircle className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Eligibility for Return or Exchange
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            Because our products are hand-blended, hygiene-sensitive personal care items, we can only accept a return or exchange if:
          </p>
          <ul className="space-y-3 pt-1 text-sm sm:text-base text-gray-700">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#B9853A] mt-2 shrink-0" />
              <span>The product arrived damaged, leaking, or broken in transit.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#B9853A] mt-2 shrink-0" />
              <span>You received the wrong product or a different item than ordered.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#B9853A] mt-2 shrink-0" />
              <span>The product is unopened, unused, and in its original sealed packaging.</span>
            </li>
          </ul>

          <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
            <FiAlertCircle className="w-5 h-5 text-[#B9853A] shrink-0 mt-0.5" />
            <p>
              <strong>Hygiene Note:</strong> For hygiene reasons, opened or used items cannot be returned or exchanged unless the product itself is defective.
            </p>
          </div>
        </section>

        {/* Section 2: Reporting a Problem */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiMessageCircle className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Reporting a Problem
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            Please message us on WhatsApp within <strong>3 days of delivery</strong> with your order ID and a clear photo or video of the issue.
          </p>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            Our support team will inspect the details and confirm the next steps — a replacement, exchange, or refund — within <strong>24 to 48 hours</strong>.
          </p>

          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] transition-all shadow-sm cursor-pointer"
            >
              <FiMessageCircle className="w-5 h-5" />
              <span>Report Issue on WhatsApp</span>
            </a>
          </div>
        </section>

        {/* Section 3: Refunds */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiCreditCard className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Refunds
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            Approved refunds for prepaid (Easypaisa/JazzCash) orders are sent back to the same account within <strong>3-5 business days</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            For Cash on Delivery (COD) orders, we will arrange a direct product replacement or provide store credit for your next purchase.
          </p>
        </section>

        {/* Section 4: Return Shipping */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FiTruck className="w-6 h-6 text-[#B9853A] shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">
              Return Shipping
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            If a return or exchange is approved due to our error (wrong or damaged item), return shipping is <strong>100% on us</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            If you wish to exchange an item for a different reason, return shipping costs may be your responsibility.
          </p>
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
