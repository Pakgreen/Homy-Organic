"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiLoader,
  FiX,
  FiSearch,
  FiExternalLink,
  FiAward,
  FiCheckCircle,
} from "react-icons/fi";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminBestSellersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSelector, setShowAddSelector] = useState(false);

  useEffect(() => {
    fetchBestSellers(true);
    fetchAllProducts();
  }, []);

  const fetchBestSellers = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await axios.get(
        "/api/products?bestSeller=true&limit=100&includeDisabled=true&sort=order"
      );
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];
      const sorted = [...data].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setBestSellers(sorted);
    } catch (error) {
      console.error("Error fetching best sellers:", error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await axios.get("/api/products?limit=100&includeDisabled=true&sort=order");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];
      setAllProducts(data);
    } catch (error) {
      console.error("Error fetching all products:", error);
    }
  };

  const toggleBestSeller = async (product: any, value: boolean) => {
    // Optimistic UI Update (Instant, no blinking)
    if (value) {
      setBestSellers((prev) =>
        [...prev, { ...product, isBestSeller: true }].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        )
      );
      setAllProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isBestSeller: true } : p))
      );
    } else {
      setBestSellers((prev) => prev.filter((p) => p._id !== product._id));
      setAllProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isBestSeller: false } : p))
      );
    }

    try {
      await axios.put(`/api/products/${product._id}`, {
        isBestSeller: value,
      });
      toast.success(
        value
          ? `Added "${product.name}" to Best Sellers!`
          : `Removed "${product.name}" from Best Sellers!`
      );
      fetchBestSellers(false);
      fetchAllProducts();
    } catch (error) {
      toast.error("Failed to update Best Seller status");
      fetchBestSellers(false);
      fetchAllProducts();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const current = bestSellers[index];
    const prev = bestSellers[index - 1];

    const currentOrder = current.order !== undefined ? current.order : index;
    const prevOrder = prev.order !== undefined ? prev.order : index - 1;

    // Optimistic Swap
    setBestSellers((prevList) => {
      const updated = [...prevList];
      const idxCurrent = updated.findIndex((p) => p._id === current._id);
      const idxPrev = updated.findIndex((p) => p._id === prev._id);
      if (idxCurrent !== -1 && idxPrev !== -1) {
        updated[idxCurrent] = { ...current, order: prevOrder };
        updated[idxPrev] = { ...prev, order: currentOrder };
      }
      return updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    try {
      await Promise.all([
        axios.put(`/api/products/${current._id}`, { order: prevOrder }),
        axios.put(`/api/products/${prev._id}`, { order: currentOrder }),
      ]);
      fetchBestSellers(false);
    } catch (error) {
      console.error("Error moving product up:", error);
      fetchBestSellers(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= bestSellers.length - 1) return;
    const current = bestSellers[index];
    const next = bestSellers[index + 1];

    const currentOrder = current.order !== undefined ? current.order : index;
    const nextOrder = next.order !== undefined ? next.order : index + 1;

    // Optimistic Swap
    setBestSellers((prevList) => {
      const updated = [...prevList];
      const idxCurrent = updated.findIndex((p) => p._id === current._id);
      const idxNext = updated.findIndex((p) => p._id === next._id);
      if (idxCurrent !== -1 && idxNext !== -1) {
        updated[idxCurrent] = { ...current, order: nextOrder };
        updated[idxNext] = { ...next, order: currentOrder };
      }
      return updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    try {
      await Promise.all([
        axios.put(`/api/products/${current._id}`, { order: nextOrder }),
        axios.put(`/api/products/${next._id}`, { order: currentOrder }),
      ]);
      fetchBestSellers(false);
    } catch (error) {
      console.error("Error moving product down:", error);
      fetchBestSellers(false);
    }
  };

  const filteredBestSellers = bestSellers.filter((item) => {
    const query = searchTerm.toLowerCase().trim();
    return (
      !query ||
      item.name?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query)
    );
  });

  // Non-best seller products available to add
  const availableToAdd = allProducts.filter((p) => !p.isBestSeller);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-12 w-full bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-80 w-full bg-gray-100 rounded-2xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <FiAward size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Homepage Showcase
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Best Selling Products 🔥
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manage products featured in the &quot;Our Best Selling Products&quot; section right after Hero Slider.
          </p>
        </div>

        <button
          onClick={() => setShowAddSelector(!showAddSelector)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
        >
          <FiPlus size={16} /> {showAddSelector ? "Close Selection" : "Add Best Sellers"}
        </button>
      </div>

      {/* Select Products to Mark as Best Seller Popup / Drawer */}
      {showAddSelector && (
        <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-200/70 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>🔥 Select Products to add to Best Sellers</span>
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {availableToAdd.length} product(s) available
            </span>
          </div>

          {availableToAdd.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              All active catalog products are already marked as Best Sellers!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
              {availableToAdd.map((prod) => (
                <div
                  key={prod._id}
                  className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3 shadow-2xs hover:border-orange-400 transition-all"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] flex items-center justify-center h-full text-gray-400 font-bold">No Img</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                      <p className="text-[10px] font-semibold text-gray-500">{formatPrice(prod.price)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBestSeller(prod, true)}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative w-full sm:w-96">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Best Sellers..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-full text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 transition-all font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Best Sellers Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredBestSellers.length === 0 ? (
          <div className="text-center py-16 space-y-3 px-4">
            <FiAward className="mx-auto text-gray-300" size={40} />
            <p className="text-base font-bold text-gray-800">No Best Seller Products marked</p>
            <p className="text-xs text-gray-500">
              Click &quot;Add Best Sellers&quot; above to select products for the homepage Best Selling section.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBestSellers.map((item: any, idx: number) => (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Order Controls */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-900 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                            #{idx + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className="w-5 h-4 bg-gray-100 hover:bg-black hover:text-white text-[9px] font-bold rounded flex items-center justify-center disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === filteredBestSellers.length - 1}
                              className="w-5 h-4 bg-gray-100 hover:bg-black hover:text-white text-[9px] font-bold rounded flex items-center justify-center disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Product Thumbnail & Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100 shrink-0">
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.name} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-bold">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{item.name}</p>
                            <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-orange-900 text-[9px] font-bold uppercase">
                              🔥 Best Seller
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-700">
                        {item.category?.name || "Uncategorized"}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {formatPrice(item.price)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${item._id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
                            title="View on store"
                          >
                            <FiExternalLink size={13} />
                          </Link>

                          <button
                            onClick={() => toggleBestSeller(item, false)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Remove from Best Sellers"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid View */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {filteredBestSellers.map((item: any, idx: number) => (
                <div
                  key={item._id}
                  className="bg-orange-50/20 rounded-xl p-4 border border-orange-200/50 flex gap-3 items-start justify-between"
                >
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-200 shrink-0 relative">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px] font-bold">
                        N/A
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-orange-200 shadow-2xs">
                            Order #{idx + 1}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-700">
                            🔥 Best Seller
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-gray-900 leading-snug">{item.name}</h3>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-bold text-gray-900">{formatPrice(item.price)}</span>
                        
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="w-6 h-6 bg-white border border-gray-200 hover:bg-black hover:text-white text-gray-700 text-[10px] font-bold rounded flex items-center justify-center disabled:opacity-20 cursor-pointer shadow-2xs"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === filteredBestSellers.length - 1}
                            className="w-6 h-6 bg-white border border-gray-200 hover:bg-black hover:text-white text-gray-700 text-[10px] font-bold rounded flex items-center justify-center disabled:opacity-20 cursor-pointer shadow-2xs"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-gray-200/60">
                      <button
                        onClick={() => toggleBestSeller(item, false)}
                        className="py-1 px-3 rounded-lg bg-red-50 border border-red-100 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
