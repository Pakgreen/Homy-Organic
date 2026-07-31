import type { Metadata } from "next";
import Link from "next/link";
import { FiShield, FiLock, FiCheckCircle, FiMail } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Homy Organic collects, uses and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center pb-10 border-b border-gray-100">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#B9853A]/10 text-[#B9853A] mb-4">
            <FiShield size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 uppercase font-serif">
            Privacy Policy
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-500 max-w-xl mx-auto font-light">
            How Homy Organic collects, uses and protects your information.
          </p>
        </div>

        {/* Content Body */}
        <div className="py-10 space-y-10 text-gray-700 leading-relaxed font-light">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-wide uppercase text-sm font-sans text-[#B9853A]">
              Information We Collect
            </h2>
            <p className="text-gray-600 leading-7">
              When you place an order or contact us, we collect the details you provide directly: your name, phone number, delivery address, city, and any order notes. We do not require an account or password to shop with us.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-wide uppercase text-sm font-sans text-[#B9853A]">
              How We Use Your Information
            </h2>
            <ul className="space-y-2.5 pt-1">
              {[
                "To process, confirm and deliver your order",
                "To contact you on WhatsApp about your order status",
                "To respond to questions sent through our contact form",
                "To improve our products and customer experience",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-600">
                  <FiCheckCircle className="w-5 h-5 text-[#B9853A] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-wide uppercase text-sm font-sans text-[#B9853A]">
              How We Share Your Information
            </h2>
            <p className="text-gray-600 leading-7">
              We never sell your personal information. Your name, phone number, and address are shared only with our delivery/courier partner to fulfill your order, and never with unrelated third parties.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-wide uppercase text-sm font-sans text-[#B9853A]">
              Payment Information
            </h2>
            <p className="text-gray-600 leading-7">
              We do not store card or account numbers. For manual bank transfers (Easypaisa/JazzCash), payment confirmation screenshots are used only to verify your order and are not shared further.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-wide uppercase text-sm font-sans text-[#B9853A]">
              Data Storage
            </h2>
            <p className="text-gray-600 leading-7">
              Your cart is stored locally in your own browser so items stay saved between visits. Order details you submit at checkout are sent directly to us via WhatsApp and are not stored on a public database.
            </p>
          </section>

          {/* Section 6 - Contact Box */}
          <section className="mt-12 p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                <FiMail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Contact Us</h3>
                <p className="text-sm text-gray-500">
                  Questions about this policy can be sent to{" "}
                  <a
                    href="mailto:support@homyorganic.pk"
                    className="text-[#B9853A] font-semibold hover:underline"
                  >
                    info@homyorganic.pk
                  </a>{" "}
                  or via WhatsApp.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors shrink-0"
            >
              Contact Support
            </Link>
          </section>

        </div>

      </div>
    </div>
  );
}
