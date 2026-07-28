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
  FiAlertTriangle,
  FiGift,
  FiPackage,
} from "react-icons/fi";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface ValuePackItem {
  name: string;
  quantity: number | "";
  price: number | "";
}

export default function AdminValuePacksPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [valuePacks, setValuePacks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState<any>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Delete Popup Modal States
  const [deletingPack, setDeletingPack] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number | "";
    originalPrice: number | "";
    category: string;
    brand: string;
    badge: string;
    images: string[];
    imageLabels: string[];
    isFeatured: boolean;
    isDisabled: boolean;
    whichIncluded: ValuePackItem[];
  }>({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    brand: "Homy Organic",
    badge: "VALUE PACK",
    images: [],
    imageLabels: [],
    isFeatured: false,
    isDisabled: false,
    whichIncluded: [{ name: "", quantity: 1, price: "" }],
  });

  useEffect(() => {
    fetchValuePacks();
    fetchCategories();
  }, []);

  const fetchValuePacks = async () => {
    try {
      const res = await axios.get(
        "/api/products?valuePack=true&limit=100&includeDisabled=true"
      );
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];
      setValuePacks(data);
    } catch (error) {
      console.error("Error fetching value packs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.categories || [];
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNumber = Number(formData.price);
    const originalPriceNumber = Number(formData.originalPrice);

    if (!priceNumber || priceNumber <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const cleanedItems = formData.whichIncluded
      .filter((item) => typeof item.name === "string" && item.name.trim().length > 0)
      .map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity) || 1,
        price: item.price !== "" ? Number(item.price) : undefined,
      }));

    const payload = {
      ...formData,
      isValuePack: true,
      price: priceNumber,
      originalPrice:
        formData.originalPrice === "" ? undefined : originalPriceNumber,
      imageLabels: formData.images.map((_, index) => {
        const label = formData.imageLabels[index];
        return typeof label === "string" && label.trim().length > 0
          ? label.trim()
          : `Design ${index + 1}`;
      }),
      whichIncluded: cleanedItems,
    };

    try {
      if (editingPack) {
        await axios.put(`/api/products/${editingPack._id}`, payload);
        toast.success("Value Pack updated successfully!");
      } else {
        await axios.post("/api/products", payload);
        toast.success("Value Pack created successfully!");
      }
      setShowModal(false);
      setEditingPack(null);
      resetForm();
      fetchValuePacks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save Value Pack");
    }
  };

  const executeDelete = async () => {
    if (!deletingPack) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/products/${deletingPack._id}`);
      toast.success("Value Pack deleted successfully");
      fetchValuePacks();
    } catch (error) {
      toast.error("Failed to delete Value Pack");
    } finally {
      setIsDeleting(false);
      setDeletingPack(null);
    }
  };

  const handleEdit = (pack: any) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name || "",
      description: pack.description || "",
      price: pack.price || "",
      originalPrice: pack.originalPrice || pack.oldPrice || "",
      category: pack.category?._id || pack.category || "",
      brand: pack.brand || "Homy Organic",
      badge: pack.badge || "VALUE PACK",
      images: pack.images || [],
      imageLabels:
        Array.isArray(pack.imageLabels) && pack.imageLabels.length > 0
          ? pack.imageLabels
          : (pack.images || []).map((_: string, index: number) =>
              `Design ${index + 1}`
            ),
      isFeatured: pack.isFeatured || false,
      isDisabled: pack.isDisabled || false,
      whichIncluded:
        Array.isArray(pack.whichIncluded) && pack.whichIncluded.length > 0
          ? pack.whichIncluded.map((item: any) =>
              typeof item === "object" && item !== null
                ? {
                    name: item.name || "",
                    quantity: typeof item.quantity === "number" ? item.quantity : 1,
                    price: typeof item.price === "number" ? item.price : "",
                  }
                : { name: String(item), quantity: 1, price: "" }
            )
          : [{ name: "", quantity: 1, price: "" }],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      brand: "Homy Organic",
      badge: "VALUE PACK",
      images: [],
      imageLabels: [],
      isFeatured: false,
      isDisabled: false,
      whichIncluded: [{ name: "", quantity: 1, price: "" }],
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        const payload = new FormData();
        payload.append("file", file);

        const res = await axios.post("/api/upload", payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data?.url) {
          uploadedUrls.push(res.data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
          imageLabels: [
            ...prev.imageLabels,
            ...uploadedUrls.map(
              (_, index) => `Design ${prev.images.length + index + 1}`
            ),
          ],
        }));
        toast.success(`Uploaded ${uploadedUrls.length} image(s)`);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image(s)");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
      imageLabels: prev.imageLabels.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const filteredPacks = valuePacks.filter((pack) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      pack.name?.toLowerCase().includes(query) ||
      pack.brand?.toLowerCase().includes(query) ||
      pack.category?.name?.toLowerCase().includes(query);

    const matchesCategory =
      !selectedCategory ||
      pack.category?._id === selectedCategory ||
      pack.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#B9853A] mb-1">
            <FiGift size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Bundles & Savings
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Value Packs
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manage exclusive bundle packages, included items, and special prices.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPack(null);
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B9853A] hover:bg-[#9a6d2f] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
        >
          <FiPlus size={16} /> Add Value Pack
        </button>
      </div>

      {/* Direct Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Value Packs..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-full text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B9853A] transition-all font-medium"
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

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#B9853A] cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Value Packs Table / Grid Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredPacks.length === 0 ? (
          <div className="text-center py-16 space-y-3 px-4">
            <FiGift className="mx-auto text-gray-300" size={40} />
            <p className="text-base font-bold text-gray-800">
              No Value Packs found
            </p>
            <p className="text-xs text-gray-500">
              Create your first Value Pack bundle to showcase special savings on the store.
            </p>
            <button
              onClick={() => {
                setEditingPack(null);
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B9853A] text-white text-xs font-bold uppercase tracking-wider"
            >
              <FiPlus size={14} /> Add Value Pack
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">Value Pack</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price / Savings</th>
                    <th className="py-3.5 px-4">Included Items</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPacks.map((pack: any) => (
                    <tr
                      key={pack._id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-50 rounded-xl overflow-hidden relative border border-amber-200/60 shrink-0">
                            {pack.images && pack.images.length > 0 ? (
                              <img
                                src={pack.images[0]}
                                alt={pack.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-500 text-[10px] font-bold">
                                🎁
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">
                              {pack.name}
                            </p>
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-[#B9853A] text-[9px] font-bold uppercase">
                              {pack.badge || "VALUE PACK"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {pack.category?.name || "General"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[#E55353]">{formatPrice(pack.price)}</span>
                          {typeof (pack.originalPrice ?? pack.oldPrice) === "number" &&
                            (pack.originalPrice ?? pack.oldPrice) > pack.price && (
                              <span className="text-[10px] text-gray-400 font-normal line-through">
                                {formatPrice(pack.originalPrice ?? pack.oldPrice)}
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-[10px] font-bold">
                          {Array.isArray(pack.whichIncluded)
                            ? pack.whichIncluded.length
                            : 0}{" "}
                          Items Included
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${pack._id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
                            title="View Pack"
                          >
                            <FiExternalLink size={13} />
                          </Link>

                          <button
                            onClick={() => handleEdit(pack)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-black hover:border-black transition-colors cursor-pointer"
                            title="Edit Pack"
                          >
                            <FiEdit size={13} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => setDeletingPack(pack)}
                              className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                              title="Delete Pack"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid View */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {filteredPacks.map((pack: any) => (
                <div
                  key={pack._id}
                  className="bg-amber-50/20 rounded-xl p-4 border border-amber-200/50 flex gap-3 items-start justify-between"
                >
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-amber-200 shrink-0 relative">
                    {pack.images && pack.images.length > 0 ? (
                      <img
                        src={pack.images[0]}
                        alt={pack.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-500 text-[12px]">
                        🎁
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#B9853A]">
                          {pack.category?.name || "Bundle"}
                        </span>
                        <h3 className="text-xs font-bold text-gray-900 leading-snug">
                          {pack.name}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-[#E55353] shrink-0">
                        {formatPrice(pack.price)}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[9px] font-bold">
                        {Array.isArray(pack.whichIncluded) ? pack.whichIncluded.length : 0} Items Included
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                      <button
                        onClick={() => handleEdit(pack)}
                        className="flex-1 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-black transition-colors"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeletingPack(pack)}
                          className="py-1.5 px-3 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Popup Modal */}
      {deletingPack && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete Value Pack?
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-normal bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900 font-bold">
                &quot;{deletingPack.name}&quot;
              </strong>{" "}
              from Value Packs?
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeletingPack(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-full border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="animate-spin" size={14} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Value Pack Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-12 min-h-screen flex flex-col pt-24">
            <div className="mb-8 border-b border-gray-200 pb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#B9853A] mb-1">
                  <FiGift size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Value Pack Builder
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {editingPack ? "Edit Value Pack" : "Create New Value Pack"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black transition-colors cursor-pointer"
              >
                <span className="text-xs uppercase tracking-widest font-medium">
                  Close
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Value Pack Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-[#B9853A] transition-colors px-0 font-medium"
                    placeholder="E.g., Organic Summer Hair & Skin Bundle"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Custom Badge / Tag
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-[#B9853A] transition-colors px-0 font-medium"
                    placeholder="E.g., BEST VALUE, -30% OFF"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Bundle Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-transparent border border-gray-200 p-4 text-xs rounded-xl focus:ring-0 focus:border-[#B9853A] transition-colors placeholder:text-gray-300 font-medium min-h-28"
                  placeholder="Describe what makes this value bundle special..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Bundle Price (Rs) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-[#B9853A] font-bold text-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Original Price / Total Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-[#B9853A] font-medium text-gray-500"
                    placeholder="Optional Total Value"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-[#B9853A] font-medium"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat: any) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Items Included in Value Pack Form */}
              <div className="border-t border-amber-200/60 pt-6 space-y-5 bg-amber-50/40 p-5 sm:p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#B9853A]">
                    <span className="text-lg">🎁</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        Items Included in Value Pack *
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Add item name, quantity (number 123), and item price/value.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        whichIncluded: [
                          ...prev.whichIncluded,
                          { name: "", quantity: 1, price: "" },
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#B9853A] hover:bg-[#9a6d2f] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <FiPlus size={14} /> Add Item
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {formData.whichIncluded.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-[#B9853A] font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              whichIncluded: prev.whichIncluded.map((it, i) =>
                                i === index ? { ...it, name: val } : it
                              ),
                            }));
                          }}
                          placeholder="Item Name (e.g. Organic Hair Growth Oil 100ml)"
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:border-[#B9853A] focus:outline-none font-medium text-gray-900 placeholder:text-gray-300"
                        />
                      </div>

                      <div className="w-full sm:w-28 shrink-0">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val =
                              e.target.value === "" ? "" : Number(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              whichIncluded: prev.whichIncluded.map((it, i) =>
                                i === index ? { ...it, quantity: val } : it
                              ),
                            }));
                          }}
                          placeholder="Qty (123)"
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:border-[#B9853A] focus:outline-none font-bold text-gray-900 placeholder:text-gray-300"
                        />
                      </div>

                      <div className="w-full sm:w-32 shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => {
                            const val =
                              e.target.value === "" ? "" : Number(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              whichIncluded: prev.whichIncluded.map((it, i) =>
                                i === index ? { ...it, price: val } : it
                              ),
                            }));
                          }}
                          placeholder="Price (Rs)"
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:border-[#B9853A] focus:outline-none font-semibold text-gray-900 placeholder:text-gray-300"
                        />
                      </div>

                      {formData.whichIncluded.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              whichIncluded: prev.whichIncluded.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer self-end sm:self-center"
                          title="Remove Item"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Multiple Images */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Value Pack Images
                </label>
                <div className="rounded-2xl border border-dashed border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-4">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                      <div className="w-full min-h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center px-4 py-6 bg-white hover:border-[#B9853A] transition cursor-pointer">
                        {isUploadingImages ? (
                          <div className="flex items-center gap-2 text-gray-700">
                            <FiLoader className="animate-spin text-[#B9853A]" />
                            <span className="text-xs font-semibold">
                              Uploading images...
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                              Click to upload Pack images
                            </span>
                            <span className="text-[11px] text-gray-400 mt-1 font-medium">
                              PNG, JPG, WEBP - first image will be cover image
                            </span>
                          </>
                        )}
                      </div>
                    </label>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {formData.images.map((image, index) => {
                          return (
                            <div
                              key={`${image}-${index}`}
                              className="rounded-xl overflow-hidden border border-gray-200 bg-white relative group"
                            >
                              <div className="h-32 bg-gray-100 relative">
                                <img
                                  src={image}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#B9853A] hover:bg-[#9a6d2f] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  {editingPack ? "Update Value Pack" : "Create Value Pack"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPack(null);
                    resetForm();
                  }}
                  className="flex-1 py-3.5 px-6 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
