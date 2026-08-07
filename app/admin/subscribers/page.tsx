"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FiMail,
  FiSearch,
  FiTrash2,
  FiCopy,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
} from "react-icons/fi";
import { format } from "date-fns";

import AdminDeleteModal from "@/components/AdminDeleteModal";

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingSub, setDeletingSub] = useState<Subscriber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async (query = "") => {
    try {
      setIsLoading(true);
      const url = query
        ? `/api/newsletter?search=${encodeURIComponent(query)}`
        : "/api/newsletter";
      const res = await axios.get(url);
      setSubscribers(res.data.subscribers || res.data || []);
    } catch (error) {
      toast.error("Failed to fetch subscribers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscribers(searchQuery);
  };

  const confirmDeleteSubscriber = async () => {
    if (!deletingSub) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/newsletter?id=${deletingSub._id}`);
      toast.success("Subscriber removed successfully");
      setSubscribers((prev) => prev.filter((s) => s._id !== deletingSub._id));
      setDeletingSub(null);
    } catch (error) {
      toast.error("Failed to remove subscriber");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyAllEmails = () => {
    if (subscribers.length === 0) {
      toast.error("No email addresses to copy");
      return;
    }
    const allEmails = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(allEmails);
    toast.success(`Copied ${subscribers.length} email addresses to clipboard!`);
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.error("No subscribers to export");
      return;
    }

    const headers = ["Email", "Status", "Subscribed Date"];
    const rows = subscribers.map((s) => [
      `"${s.email}"`,
      `"${s.status}"`,
      `"${format(new Date(s.createdAt), "yyyy-MM-dd HH:mm:ss")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `homy_organic_subscribers_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscribers CSV exported successfully!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
            <FiMail className="text-[#B9853A]" />
            Email Subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage newsletter subscriptions collected from your website footer.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleCopyAllEmails}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <FiCopy size={16} />
            Copy All Emails
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <FiDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Card & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Metric box */}
        <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">
              Total Subscribers
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {subscribers.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#B9853A]/10 text-[#B9853A] flex items-center justify-center">
            <FiCheckCircle size={24} />
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="md:col-span-8 flex items-center gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search subscriber by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors cursor-pointer"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              fetchSubscribers("");
            }}
            className="p-3 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh"
          >
            <FiRefreshCw size={18} />
          </button>
        </form>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-[#B9853A]/30 border-t-[#B9853A] rounded-full animate-spin mx-auto mb-3" />
            Loading subscribers...
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiMail size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-base text-gray-700">No subscribers found</p>
            <p className="text-xs text-gray-400 mt-1">
              Subscribed emails from your website footer will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">#</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Subscribed Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((subscriber, index) => (
                  <tr
                    key={subscriber._id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {subscriber.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-xs">
                      {subscriber.createdAt
                        ? format(new Date(subscriber.createdAt), "MMM dd, yyyy • hh:mm a")
                        : "N/A"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDeletingSub(subscriber)}
                        disabled={isDeleting}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Subscriber"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminDeleteModal
        isOpen={!!deletingSub}
        title="Remove Subscriber?"
        description="Are you sure you want to remove this email address from the newsletter subscribers list?"
        itemName={deletingSub?.email}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteSubscriber}
        onClose={() => setDeletingSub(null)}
      />
    </div>
  );
}
