"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { FiEdit, FiTrash2, FiPlus, FiLoader, FiX, FiSearch, FiExternalLink, FiAlertTriangle } from "react-icons/fi";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminProductsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // Delete Popup Modal States
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const triggerDelete = (product: any) => {
    setDeletingProduct(product);
  };

  const executeDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/products/${deletingProduct._id}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
      setDeletingProduct(null);
    }
  };
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
    isBestSeller: boolean;
    isDisabled: boolean;
    isValuePack: boolean;
    whichIncluded: Array<{ name: string; quantity: number | ""; price: number | "" }>;
    keyBenefits: string;
    naturalIngredients: string;
    howToUse: string;
    precautions: string;
    ourQuality: string;
  }>({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    brand: "",
    badge: "",
    images: [],
    imageLabels: [],
    isFeatured: false,
    isBestSeller: false,
    isDisabled: false,
    isValuePack: false,
    whichIncluded: [{ name: "", quantity: 1, price: "" }],
    keyBenefits: "",
    naturalIngredients: "",
    howToUse: "",
    precautions: "",
    ourQuality: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products?limit=100&includeDisabled=true&sort=order");
      const data = Array.isArray(res.data) ? res.data : res.data.products || [];
      // Ensure local sorting by order
      const sorted = [...data].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setProducts(sorted);
    } catch (error: any) {
      console.error(
        "Failed to fetch products:",
        error.response?.data || error.message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      // Handle both formats: array directly or object with categories property
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
      return;
    }
    if (
      formData.originalPrice !== "" &&
      (!originalPriceNumber ||
        originalPriceNumber <= 0 ||
        originalPriceNumber <= priceNumber)
    ) {
      return;
    }

    const payload = {
      ...formData,
      price: priceNumber,
      originalPrice:
        formData.originalPrice === "" ? undefined : originalPriceNumber,
      imageLabels: formData.images.map((_, index) => {
        const label = formData.imageLabels[index];
        return typeof label === "string" && label.trim().length > 0
          ? label.trim()
          : `Design ${index + 1}`;
      }),
      keyBenefits: formData.keyBenefits
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      naturalIngredients: formData.naturalIngredients
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      whichIncluded: formData.isValuePack
        ? formData.whichIncluded
            .filter((item) => typeof item.name === "string" && item.name.trim().length > 0)
            .map((item) => ({
              name: item.name.trim(),
              quantity: Number(item.quantity) || 1,
              price: item.price !== "" ? Number(item.price) : undefined,
            }))
        : [],
    };

    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct._id}`, payload);
        toast.success("Product updated successfully");
      } else {
        await axios.post("/api/products", payload);
        toast.success("Product created successfully");
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save product");
    }
  };

  const handleMoveProductUp = async (index: number) => {
    if (index <= 0) return;
    const current = filteredProducts[index];
    const prev = filteredProducts[index - 1];

    const currentOrder = current.order !== undefined ? current.order : index;
    const prevOrder = prev.order !== undefined ? prev.order : index - 1;

    // Optimistic UI Swap
    setProducts((prevProducts) => {
      const updated = [...prevProducts];
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
      fetchProducts();
    } catch (error) {
      console.error("Error moving product up:", error);
      fetchProducts();
    }
  };

  const handleMoveProductDown = async (index: number) => {
    if (index >= filteredProducts.length - 1) return;
    const current = filteredProducts[index];
    const next = filteredProducts[index + 1];

    const currentOrder = current.order !== undefined ? current.order : index;
    const nextOrder = next.order !== undefined ? next.order : index + 1;

    // Optimistic UI Swap
    setProducts((prevProducts) => {
      const updated = [...prevProducts];
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
      fetchProducts();
    } catch (error) {
      console.error("Error moving product down:", error);
      fetchProducts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Product deleted successfully");

      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      originalPrice: product.originalPrice || product.oldPrice || "",
      category: product.category?._id || product.category || "",
      brand: product.brand || "",
      badge: product.badge || "",
      images: product.images || [],
      imageLabels:
        Array.isArray(product.imageLabels) && product.imageLabels.length > 0
          ? product.imageLabels
          : (product.images || []).map((_: string, index: number) =>
              `Design ${index + 1}`,
            ),
      isFeatured: product.isFeatured || false,
      isBestSeller: product.isBestSeller || false,
      isDisabled: product.isDisabled || false,
      isValuePack: product.isValuePack || false,
      whichIncluded:
        Array.isArray(product.whichIncluded) && product.whichIncluded.length > 0
          ? product.whichIncluded.map((item: any) =>
              typeof item === "object" && item !== null
                ? {
                    name: item.name || "",
                    quantity: typeof item.quantity === "number" ? item.quantity : 1,
                    price: typeof item.price === "number" ? item.price : "",
                  }
                : { name: String(item), quantity: 1, price: "" }
            )
          : [{ name: "", quantity: 1, price: "" }],
      keyBenefits: Array.isArray(product.keyBenefits)
        ? product.keyBenefits.join("\n")
        : product.keyBenefits || "",
      naturalIngredients: Array.isArray(product.naturalIngredients)
        ? product.naturalIngredients.join("\n")
        : product.naturalIngredients || "",
      howToUse: product.howToUse || "",
      precautions: product.precautions || "",
      ourQuality: product.ourQuality || "",
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
      brand: "",
      badge: "",
      images: [],
      imageLabels: [],
      isFeatured: false,
      isBestSeller: false,
      isDisabled: false,
      isValuePack: false,
      whichIncluded: [{ name: "", quantity: 1, price: "" }],
      keyBenefits: "",
      naturalIngredients: "",
      howToUse: "",
      precautions: "",
      ourQuality: "",
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
            ...uploadedUrls.map((_, index) => `Design ${prev.images.length + index + 1}`),
          ],
        }));
        toast.success(`${uploadedUrls.length} image(s) uploaded`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to upload image(s)");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImageAtIndex = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
      imageLabels: prev.imageLabels.filter((_, index) => index !== indexToRemove),
    }));
  };

  const updateImageLabel = (indexToUpdate: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      imageLabels: prev.images.map((_, index) =>
        index === indexToUpdate
          ? value
          : prev.imageLabels[index] || `Design ${index + 1}`,
      ),
    }));
  };

  // Filtered Products Computation
  const filteredProducts = products.filter((product) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      product.name?.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query);

    const matchesCategory =
      !selectedCategory ||
      product.category?._id === selectedCategory ||
      product.category === selectedCategory;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? !product.isDisabled
        : statusFilter === "disabled"
        ? product.isDisabled
        : statusFilter === "featured"
        ? product.isFeatured
        : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-16 w-full bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-80 w-full bg-gray-100 rounded-2xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Products Catalog
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Manage product items, prices, categories, and organic details.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
        >
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Direct Search Bar (No Card Box) */}
      <div className="relative w-full max-w-md">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-full text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all font-medium"
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

      {/* Products Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 space-y-3 px-4">
            <p className="text-base font-bold text-gray-800">
              No products found
            </p>
            <p className="text-xs text-gray-500">
              {searchTerm || selectedCategory || statusFilter !== "all"
                ? "Try adjusting your search query or filters."
                : "Start by adding your first product to populate the catalog."}
            </p>
            {searchTerm || selectedCategory || statusFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setStatusFilter("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-xs font-bold text-gray-700 hover:border-black"
              >
                Clear Search & Filters
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider"
              >
                <FiPlus size={14} /> Add Product
              </button>
            )}
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
                    <th className="py-3.5 px-4">Category & Brand</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product: any, idx: number) => (
                    <tr key={product._id} className="hover:bg-gray-50/60 transition-colors">
                      
                      {/* Order Controls & Index */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200/80">
                            #{idx + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveProductUp(idx)}
                              disabled={idx === 0}
                              className="w-5 h-4 bg-gray-100 hover:bg-black hover:text-white text-[9px] font-bold rounded flex items-center justify-center disabled:opacity-20 transition-colors cursor-pointer"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveProductDown(idx)}
                              disabled={idx === filteredProducts.length - 1}
                              className="w-5 h-4 bg-gray-100 hover:bg-black hover:text-white text-[9px] font-bold rounded flex items-center justify-center disabled:opacity-20 transition-colors cursor-pointer"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100 shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-bold">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">
                              {product.name}
                            </p>
                            {product.slug && (
                              <p className="text-[10px] text-gray-400 font-normal">
                                /{product.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                            {product.category?.name || "Uncategorized"}
                          </span>
                          {product.brand && (
                            <p className="text-[10px] text-gray-400 font-medium pl-1">
                              Brand: {product.brand}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div className="flex items-baseline gap-1.5">
                          <span>{formatPrice(product.price)}</span>
                          {typeof (product.originalPrice ?? product.oldPrice) === "number" &&
                            (product.originalPrice ?? product.oldPrice) > product.price && (
                              <span className="text-[10px] text-gray-400 font-normal line-through">
                                {formatPrice(product.originalPrice ?? product.oldPrice)}
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {product.isBestSeller && (
                            <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 text-[10px] font-bold uppercase tracking-wider">
                              🔥 Best Seller
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                              Featured
                            </span>
                          )}
                          {product.isDisabled ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                              Disabled
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${product._id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
                            title="View on store"
                          >
                            <FiExternalLink size={13} />
                          </Link>

                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-black hover:border-black transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <FiEdit size={13} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => triggerDelete(product)}
                              className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                              title="Delete Product"
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
              {filteredProducts.map((product: any, idx: number) => (
                <div
                  key={product._id}
                  className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 flex gap-3 items-start justify-between"
                >
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-200 shrink-0 relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
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
                          <span className="text-[9px] font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                            Order #{idx + 1}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#B9853A]">
                            {product.category?.name || "Uncategorized"}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-gray-900 leading-snug">
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        
                        {/* Order Navigation Arrows on Mobile */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            onClick={() => handleMoveProductUp(idx)}
                            disabled={idx === 0}
                            className="w-6 h-6 bg-white border border-gray-200 hover:bg-black hover:text-white text-gray-700 text-[10px] font-bold rounded flex items-center justify-center disabled:opacity-20 cursor-pointer shadow-2xs"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveProductDown(idx)}
                            disabled={idx === filteredProducts.length - 1}
                            className="w-6 h-6 bg-white border border-gray-200 hover:bg-black hover:text-white text-gray-700 text-[10px] font-bold rounded flex items-center justify-center disabled:opacity-20 cursor-pointer shadow-2xs"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      {product.isBestSeller && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 text-[9px] font-bold uppercase">
                          🔥 Best Seller
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold uppercase">
                          Featured
                        </span>
                      )}
                      {product.isDisabled ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold uppercase">
                          Disabled
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-black transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => triggerDelete(product)}
                          className="py-1.5 px-3 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
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

      {/* Custom Delete Confirmation Popup Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Product?</h3>
                <p className="text-xs text-gray-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-normal bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900 font-bold">&quot;{deletingProduct.name}&quot;</strong> from your product catalog?
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-12 min-h-screen flex flex-col pt-24">
            <div className="mb-12 border-b border-gray-200 pb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-light text-gray-900 uppercase tracking-widest">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h3>
                <p className="mt-2 text-xs text-gray-400 uppercase tracking-widest w-full">
                  CONFIGURE PRODUCT DETAILS AND INVENTORY
                </p>
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

            <form
              onSubmit={handleSubmit}
              className="space-y-10 flex-1 flex flex-col"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 placeholder:text-gray-300 font-light"
                    placeholder="Enter product name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 placeholder:text-gray-300 font-light"
                    placeholder="E.g., Homy Organic"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Custom Tag / Badge
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 placeholder:text-gray-300 font-light"
                    placeholder="E.g. NEW, HOT SALE, BESTSELLER"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-transparent border border-gray-200 p-4 text-sm focus:ring-0 focus:border-black transition-colors placeholder:text-gray-300 font-light min-h-35 resize-y"
                  placeholder="Detailed product description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Price *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={formData.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        price: value === "" ? "" : Number(value),
                      });
                    }}
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 placeholder:text-gray-300 font-light"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Old Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.originalPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        originalPrice: value === "" ? "" : Number(value),
                      });
                    }}
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 placeholder:text-gray-300 font-light"
                    placeholder="Optional"
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
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 font-light appearance-none"
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

              {/* Value Pack Included Items Form OR Standard Organic Highlights */}
              {formData.isValuePack ? (
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

                  {/* Dynamic List of Included Item Form Rows */}
                  <div className="space-y-3 pt-2">
                    {formData.whichIncluded.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs"
                      >
                        {/* Row Number Badge */}
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-[#B9853A] font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        {/* Item Name */}
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

                        {/* Quantity Number 123 */}
                        <div className="w-full sm:w-28 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : Number(e.target.value);
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

                        {/* Price / Value */}
                        <div className="w-full sm:w-32 shrink-0">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : Number(e.target.value);
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

                        {/* Delete Row Button */}
                        {formData.whichIncluded.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                whichIncluded: prev.whichIncluded.filter((_, i) => i !== index),
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
              ) : (
                <div className="border-t border-gray-100 pt-6 space-y-6">
                  <p className="text-xs font-bold text-[#B9853A] uppercase tracking-wider">
                    Organic Product Highlights & Usage
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Key Benefits <span className="text-gray-400 font-normal">(Enter each benefit on a new line)</span>
                      </label>
                      <textarea
                        rows={5}
                        value={formData.keyBenefits}
                        onChange={(e) => setFormData({ ...formData, keyBenefits: e.target.value })}
                        placeholder="e.g.&#10;100% Pure & Unrefined&#10;Boosts Natural Immunity & Energy&#10;Rich in Essential Vitamins & Antioxidants&#10;No Added Sugar or Preservatives"
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Selected Natural Ingredients <span className="text-gray-400 font-normal">(Enter each ingredient on a new line)</span>
                      </label>
                      <textarea
                        rows={5}
                        value={formData.naturalIngredients}
                        onChange={(e) => setFormData({ ...formData, naturalIngredients: e.target.value })}
                        placeholder="e.g.&#10;Raw Wildflower Honey Extract&#10;Organic Cold-Pressed Seed Oil&#10;Natural Herbal Essences&#10;Vitamin E & Minerals"
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        How to Use
                      </label>
                      <textarea
                        rows={3}
                        value={formData.howToUse}
                        onChange={(e) => setFormData({ ...formData, howToUse: e.target.value })}
                        placeholder="e.g. Take 1 tablespoon daily with warm water..."
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Precautions
                      </label>
                      <textarea
                        rows={3}
                        value={formData.precautions}
                        onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
                        placeholder="e.g. Keep out of reach of children under 1 year. Store in a cool dry place."
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Our Quality Commitment
                      </label>
                      <textarea
                        rows={3}
                        value={formData.ourQuality}
                        onChange={(e) => setFormData({ ...formData, ourQuality: e.target.value })}
                        placeholder="e.g. 100% Lab Tested, No Chemicals, Unrefined Organic Product."
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-gray-700">
                  Product Images
                </label>
                <div className="rounded-lg border border-dashed border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-4">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                      <div className="w-full min-h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center px-4 py-6 bg-white hover:border-gray-400 transition cursor-pointer">
                        {isUploadingImages ? (
                          <div className="flex items-center gap-2 text-gray-700">
                            <FiLoader className="animate-spin" />
                            <span className="text-sm font-medium">
                              Uploading images...
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-semibold text-gray-800">
                              Click to upload multiple images
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              PNG, JPG, WEBP - first image will be cover image
                            </span>
                          </>
                        )}
                      </div>
                    </label>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {formData.images.map((image, index) => {
                          const label =
                            formData.imageLabels[index] || `Design ${index + 1}`;

                          return (
                            <div
                              key={`${image}-${index}`}
                              className="rounded-lg overflow-hidden border border-gray-200 bg-white"
                            >
                              <div className="relative aspect-square">
                                <img
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImageAtIndex(index)}
                                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-white/95 border border-gray-200 text-gray-700 hover:text-red-600 cursor-pointer flex items-center justify-center"
                                  aria-label="Remove image"
                                >
                                  <FiX size={14} />
                                </button>
                                {index === 0 && (
                                  <span className="absolute left-1.5 bottom-1.5 text-[10px] px-2 py-0.5 rounded-full bg-black text-white font-semibold">
                                    Cover
                                  </span>
                                )}
                              </div>

                              <div className="border-t border-gray-100 p-3 space-y-2">
                                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                                  Design Name
                                </label>
                                <input
                                  type="text"
                                  value={label}
                                  onChange={(e) =>
                                    updateImageLabel(index, e.target.value)
                                  }
                                  className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-xs text-gray-800 focus:border-black focus:ring-0"
                                  placeholder={`Design ${index + 1}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-orange-200/80 bg-orange-50/50 px-4 py-3">
                <input
                  type="checkbox"
                  id="isBestSeller"
                  checked={formData.isBestSeller}
                  onChange={(e) =>
                    setFormData({ ...formData, isBestSeller: e.target.checked })
                  }
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 rounded cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">
                    Best Seller Product 🔥
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    Displays in the &quot;Our Best Selling Products&quot; section right after Hero Slider.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    Featured product
                  </span>
                  <span className="text-xs text-gray-500">
                    Showcase on the home and category highlights.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3">
                <input
                  type="checkbox"
                  id="isValuePack"
                  checked={formData.isValuePack}
                  onChange={(e) =>
                    setFormData({ ...formData, isValuePack: e.target.checked })
                  }
                  className="h-4 w-4 text-[#B9853A] focus:ring-[#B9853A] rounded cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">
                    Add to Value Pack 
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    Renders exclusively in the Value Packs section (hidden from standard product catalog).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formData.isDisabled}
                  onChange={(e) =>
                    setFormData({ ...formData, isDisabled: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    Disable product
                  </span>
                  <span className="text-xs text-gray-500">
                    Hidden from the public site, search, and product pages.
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="btn btn-secondary flex-1"
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
