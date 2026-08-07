"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FiTag,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiUserCheck,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiPercent,
  FiDollarSign,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  influencerName?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Coupon Form Data
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    influencerName: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/coupons");
      setCoupons(res.data.coupons || []);
    } catch (error: any) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.discountValue) {
      toast.error("Please fill in coupon code and discount value");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/coupons", formData);
      toast.success(res.data.message || "Token created successfully!");
      setIsModalOpen(false);
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        influencerName: "",
        minOrderAmount: "",
        maxDiscountAmount: "",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
      });
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create token");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/coupons?id=${id}`);
      toast.success("Token removed successfully");
      setIsDeletingId(null);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete token");
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.influencerName &&
        c.influencerName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalUsed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
  const activeCount = coupons.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FiTag className="text-[#B9853A]" /> Token & Coupon Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Issue tokens/coupons to influencers, track sales redemptions, and manage discount codes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <FiPlus size={16} />
          <span>Issue New Token</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Tokens Issued
          </p>
          <p className="text-2xl font-extrabold text-gray-900">{coupons.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Tokens
          </p>
          <p className="text-2xl font-extrabold text-emerald-600">{activeCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Redemptions
          </p>
          <p className="text-2xl font-extrabold text-indigo-600">{totalUsed}</p>
        </div>
      </div>

      {/* Search & Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search token code or influencer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black bg-gray-50/50"
            />
          </div>

          <button
            onClick={fetchCoupons}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer self-end sm:self-auto"
            title="Refresh List"
          >
            <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Tokens Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Token Code</th>
                <th className="py-3 px-4">Issued To (Influencer)</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min. Order</th>
                <th className="py-3 px-4">Usage Count</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading tokens...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No tokens found. Click &quot;Issue New Token&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired =
                    coupon.expiresAt &&
                    new Date(coupon.expiresAt).getTime() < Date.now();

                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-black uppercase">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                          <FiTag className="text-[#B9853A]" size={13} />
                          {coupon.code}
                        </span>
                      </td>

                      {/* Issued To / Influencer */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {coupon.influencerName ? (
                          <span className="inline-flex items-center gap-1.5 text-gray-900 font-semibold">
                            <FiUserCheck className="text-blue-600" size={14} />
                            {coupon.influencerName}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-light italic">General Promo</span>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% OFF`
                          : `PKR ${coupon.discountValue.toLocaleString()} OFF`}
                      </td>

                      {/* Min Order */}
                      <td className="py-3.5 px-4 text-gray-600">
                        {coupon.minOrderAmount
                          ? `PKR ${coupon.minOrderAmount.toLocaleString()}`
                          : "No Min"}
                      </td>

                      {/* Usage Count */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900">{coupon.usedCount}</span>
                        {coupon.usageLimit ? (
                          <span className="text-gray-400"> / {coupon.usageLimit}</span>
                        ) : (
                          <span className="text-gray-400"> (Unlimited)</span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 text-gray-600 text-xs whitespace-nowrap">
                        {coupon.expiresAt ? (
                          <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                            {new Date(coupon.expiresAt).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Expired
                          </span>
                        ) : coupon.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Action: Delete Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setIsDeletingId(coupon._id)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove Token"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Token Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiTag className="text-[#B9853A]" /> Issue New Token / Coupon
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
              {/* Token Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Token Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SARAH20 or WELCOME10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 uppercase font-mono text-sm focus:outline-none focus:border-black"
                />
              </div>

              {/* Influencer / Recipient Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Issued To (Influencer Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Khan (Instagram)"
                  value={formData.influencerName}
                  onChange={(e) => setFormData({ ...formData, influencerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:border-black"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Amount (PKR OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={formData.discountType === "percentage" ? "e.g. 20 (for 20%)" : "e.g. 500 (for PKR 500)"}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Min Order & Max Usage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Min. Order Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000 (Optional)"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Max Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 (Optional)"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-black text-white font-bold hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Issuing..." : "Issue Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <FiAlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Remove Token?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this token code? Customers will no longer be able to use it.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(isDeletingId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
              >
                Yes, Delete Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
