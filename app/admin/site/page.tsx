"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import LocalImageUpload from "@/components/LocalImageUpload";
import { FiGlobe, FiMail, FiPhone, FiMapPin, FiCreditCard, FiTruck, FiSave, FiCheckCircle } from "react-icons/fi";

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<{
    logo: string;
    aboutUsText: string;
    contactUsText: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    paymentAccountDetails: string;
    allowedPaymentMethods: "both" | "cod" | "prepaid";
    deliveryChargesEnabled: boolean;
    deliveryChargeAmount: number | "";
  }>({
    logo: "",
    aboutUsText: "",
    contactUsText: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    paymentAccountDetails: "",
    allowedPaymentMethods: "both",
    deliveryChargesEnabled: false,
    deliveryChargeAmount: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings/site");
        setFormData({
          logo: data.logo || "/homyorganic.png",
          aboutUsText: data.aboutUsText || "",
          contactUsText: data.contactUsText || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          contactAddress: data.contactAddress || "",
          paymentAccountDetails:
            data.paymentAccountDetails ||
            "JazzCash: 0308 6753520 (Rabia Malik)",
          allowedPaymentMethods: data.allowedPaymentMethods || "both",
          deliveryChargesEnabled: data.deliveryChargesEnabled || false,
          deliveryChargeAmount: data.deliveryChargeAmount || "",
        });
      } catch (error) {
        toast.error("Failed to load site settings");
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      logo: url,
    }));
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logo: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        deliveryChargeAmount:
          formData.deliveryChargeAmount === "" ? 0 : Number(formData.deliveryChargeAmount),
      };
      await axios.put("/api/settings/site", payload);
      toast.success("Site settings updated successfully");
    } catch (error) {
      toast.error("Failed to update site settings");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-40 w-full bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-60 w-full bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Site Settings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage global brand identity, contact info & shipping rules</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 w-fit"
          style={{ backgroundColor: "#B9853A" }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#a07230")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B9853A")}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <>
              <FiSave size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Brand Identity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <FiGlobe size={18} style={{ color: "#B9853A" }} />
            <h3 className="text-base font-bold text-gray-900">Brand Identity</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Site Logo
            </label>
            <div className="w-full max-w-md sm:max-w-lg">
              <LocalImageUpload
                value={formData.logo}
                onChange={handleImageUpload}
                onRemove={handleImageRemove}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Recommended: PNG or SVG with transparent background. Appears in navbar and footer.
            </p>
          </div>
        </div>

        {/* Section 2: Page Content & Story */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <FiCheckCircle size={18} style={{ color: "#B9853A" }} />
            <h3 className="text-base font-bold text-gray-900">Page Content</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                About Us Story
              </label>
              <textarea
                value={formData.aboutUsText}
                onChange={(e) => setFormData((prev) => ({ ...prev, aboutUsText: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                placeholder="Tell your brand's story..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Contact Page Intro Message
              </label>
              <textarea
                value={formData.contactUsText}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactUsText: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                placeholder="Short greeting displayed above contact form..."
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contact & Payment Information */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <FiMail size={18} style={{ color: "#B9853A" }} />
            <h3 className="text-base font-bold text-gray-900">Contact & Payment Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  placeholder="info@homyorganic.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Physical Address
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={formData.contactAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactAddress: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                placeholder="Store address, City, Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Allowed Checkout Payment Options (آرڈر پورٹل اپشنز)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`relative flex flex-col items-center justify-center p-4 min-h-[100px] border rounded-xl cursor-pointer transition-all duration-200 select-none ${
                  formData.allowedPaymentMethods === "both"
                    ? "border-[#B9853A] bg-amber-50/50 text-gray-900 ring-1 ring-[#B9853A]"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 hover:bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="allowedPaymentMethods"
                  value="both"
                  checked={formData.allowedPaymentMethods === "both"}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, allowedPaymentMethods: "both" }))
                  }
                  className="sr-only"
                />
                <FiCreditCard className={`mb-1.5 transition-colors ${formData.allowedPaymentMethods === "both" ? "text-[#B9853A]" : "text-gray-400"}`} size={22} />
                <span className="text-xs font-semibold text-center text-gray-900">Both Options</span>
                <span className="text-[11px] text-gray-500 text-center mt-0.5">
                  COD & Prepaid Advance
                </span>
              </label>

              <label
                className={`relative flex flex-col items-center justify-center p-4 min-h-[100px] border rounded-xl cursor-pointer transition-all duration-200 select-none ${
                  formData.allowedPaymentMethods === "cod"
                    ? "border-[#B9853A] bg-amber-50/50 text-gray-900 ring-1 ring-[#B9853A]"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 hover:bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="allowedPaymentMethods"
                  value="cod"
                  checked={formData.allowedPaymentMethods === "cod"}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, allowedPaymentMethods: "cod" }))
                  }
                  className="sr-only"
                />
                <FiTruck className={`mb-1.5 transition-colors ${formData.allowedPaymentMethods === "cod" ? "text-[#B9853A]" : "text-gray-400"}`} size={22} />
                <span className="text-xs font-semibold text-center text-gray-900">COD Only</span>
                <span className="text-[11px] text-gray-500 text-center mt-0.5">
                  (آرڈر ملنے پر ادائیگی)
                </span>
              </label>

              <label
                className={`relative flex flex-col items-center justify-center p-4 min-h-[100px] border rounded-xl cursor-pointer transition-all duration-200 select-none ${
                  formData.allowedPaymentMethods === "prepaid"
                    ? "border-[#B9853A] bg-amber-50/50 text-gray-900 ring-1 ring-[#B9853A]"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 hover:bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="allowedPaymentMethods"
                  value="prepaid"
                  checked={formData.allowedPaymentMethods === "prepaid"}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, allowedPaymentMethods: "prepaid" }))
                  }
                  className="sr-only"
                />
                <FiCreditCard className={`mb-1.5 transition-colors ${formData.allowedPaymentMethods === "prepaid" ? "text-[#B9853A]" : "text-gray-400"}`} size={22} />
                <span className="text-xs font-semibold text-center text-gray-900">Prepaid Only</span>
                <span className="text-[11px] text-gray-500 text-center mt-0.5">
                  (پہلے ادائیگی ٹرانسفر)
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Select which payment options are shown to customers on the checkout page.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Prepaid Payment Account Details
            </label>
            <div className="relative">
              <textarea
                value={formData.paymentAccountDetails}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentAccountDetails: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-none"
                placeholder="JazzCash / EasyPaisa / Bank transfer details shown at checkout"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              These details will be displayed to customers selecting prepaid payment at checkout.
            </p>
          </div>
        </div>

        {/* Section 4: Shipping & Delivery */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <FiTruck size={18} style={{ color: "#B9853A" }} />
            <h3 className="text-base font-bold text-gray-900">Shipping & Delivery</h3>
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-800">Enable Delivery Charges</p>
              <p className="text-xs text-gray-400 mt-0.5">Apply flat shipping fee to customer checkouts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.deliveryChargesEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryChargesEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B9853A]"></div>
            </label>
          </div>

          {formData.deliveryChargesEnabled && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Delivery Charge Amount (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={formData.deliveryChargeAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deliveryChargeAmount:
                      e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-full max-w-xs px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                placeholder="Enter amount (e.g. 200)"
              />
            </div>
          )}
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            style={{ backgroundColor: "#B9853A" }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#a07230")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B9853A")}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <FiSave size={16} />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
