"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { FiEdit, FiTrash2, FiPlus, FiLoader, FiX } from "react-icons/fi";
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
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number | "";
    originalPrice: number | "";
    category: string;
    brand: string;
    images: string[];
    imageLabels: string[];
    isFeatured: boolean;
    isDisabled: boolean;
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
    images: [],
    imageLabels: [],
    isFeatured: false,
    isDisabled: false,
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
      const res = await axios.get("/api/products?limit=100&includeDisabled=true");
      console.log("Products API response:", res.data);
      setProducts(res.data.products || res.data || []);
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
      images: product.images || [],
      imageLabels:
        Array.isArray(product.imageLabels) && product.imageLabels.length > 0
          ? product.imageLabels
          : (product.images || []).map((_: string, index: number) =>
              `Design ${index + 1}`,
            ),
      isFeatured: product.isFeatured || false,
      isDisabled: product.isDisabled || false,
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
      images: [],
      imageLabels: [],
      isFeatured: false,
      isDisabled: false,
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-12 w-full max-w-sm bg-gray-200 rounded animate-pulse" />
        <div className="h-80 w-full bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6 w-full">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Products
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-light">
            Create, edit, and curate items quickly.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowModal(true);
          }}
          className="text-xs uppercase tracking-widest font-medium text-gray-900 hover:text-gray-500 border-b border-transparent hover:border-gray-500 transition-colors cursor-pointer pb-0.5 flex items-center gap-2"
        >
          <FiPlus strokeWidth={1.5} size={14} /> Add Product
        </button>
      </div>

      <div className="w-full">
        {products.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-lg font-semibold text-gray-800">
              No products yet
            </p>
            <p className="text-sm text-gray-500">
              Start by adding your first product to populate the catalog.
            </p>
            <button
              onClick={() => {
                setEditingProduct(null);
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white font-semibold hover:bg-neutral-800"
            >
              <FiPlus /> Add Product
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-700">
                    <th className="text-left py-3 px-4">Image</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Featured</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden relative border border-gray-200">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-[10px] font-medium">
                                No Img
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 font-light text-gray-900 text-sm">
                        {product.name}
                      </td>
                      <td className="py-5 px-6 text-gray-500 text-sm font-light whitespace-nowrap">
                        {product.category?.name || "N/A"}
                      </td>
                      <td className="py-5 px-6 text-gray-900 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span>{formatPrice(product.price)}</span>
                          {typeof (
                            product.originalPrice ?? product.oldPrice
                          ) === "number" &&
                            (product.originalPrice ?? product.oldPrice) >
                              product.price && (
                              <span className="text-[10px] text-gray-400 line-through font-light decoration-gray-300">
                                {formatPrice(
                                  product.originalPrice ?? product.oldPrice,
                                )}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-wrap items-center gap-2">
                          {product.isFeatured ? (
                            <span className="inline-flex items-center gap-1 border border-green-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-green-700">
                              Featured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 border border-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                              Standard
                            </span>
                          )}
                          {product.isDisabled ? (
                            <span className="inline-flex items-center gap-1 border border-red-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-red-700">
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 border border-emerald-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 pl-6 text-right flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-xs font-medium text-gray-400 hover:text-black transition-colors cursor-pointer"
                          aria-label="Edit product"
                        >
                          <FiEdit size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label="Delete product"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:hidden">
              {products.map((product: any) => (
                <div
                  key={product._id}
                  className="bg-transparent border-b border-gray-100 py-6 flex gap-4 last:border-b-0"
                >
                  <div className="shrink-0 w-24 h-24 bg-gray-50 overflow-hidden border border-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover w-full h-full mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-[10px] font-medium tracking-tight">
                          N/A
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-light text-gray-500 mb-1 uppercase tracking-widest">
                        {product.category?.name || "N/A"}
                      </p>
                      <h3 className="text-sm font-medium text-gray-900 leading-tight">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                          {typeof (
                            product.originalPrice ?? product.oldPrice
                          ) === "number" &&
                            (product.originalPrice ?? product.oldPrice) >
                              product.price && (
                              <span className="text-[10px] text-gray-400 font-light line-through decoration-gray-300">
                                {formatPrice(
                                  product.originalPrice ?? product.oldPrice,
                                )}
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {product.isFeatured ? (
                            <span className="inline-flex items-center gap-1 border border-green-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-green-700">
                              Featured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 border border-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                              Standard
                            </span>
                          )}
                          {product.isDisabled ? (
                            <span className="inline-flex items-center gap-1 border border-red-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-red-700">
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 border border-emerald-200 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 py-2 text-xs font-medium text-gray-600 hover:text-black border border-gray-200 hover:border-gray-900 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                        aria-label="Edit product"
                      >
                        <FiEdit size={12} />
                        <span>Edit</span>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="flex-1 py-2 text-xs font-medium text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 hover:bg-red-50 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                          aria-label="Delete product"
                        >
                          <FiTrash2 size={12} />
                          <span>Delete</span>
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
                    placeholder="E.g., Nike, Custom"
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

              {/* Organic Product Highlights & Details */}
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

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="h-4 w-4"
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
