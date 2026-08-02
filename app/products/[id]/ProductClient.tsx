"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiShare2,
  FiTruck,
} from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import axios from "axios";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/ProductCard";

function ProductSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white animate-pulse">
      <div className="h-4 w-24 bg-gray-50 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="h-105 sm:h-140 bg-gray-50 border border-gray-100" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-50 border border-gray-100" />
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div className="h-5 w-24 bg-gray-50" />
          <div className="h-9 w-4/5 bg-gray-50" />
          <div className="h-6 w-1/3 bg-gray-50" />
          <div className="h-24 w-full bg-gray-50" />
          <div className="h-12 w-full bg-gray-50" />
        </div>
      </div>
    </div>
  );
}

interface ProductClientProps {
  productId: string;
}

export default function ProductClient({ productId }: ProductClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [valuePacks, setValuePacks] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const [sharePopup, setSharePopup] = useState<string | null>(null);
  const shareTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const productImageVariants =
    Array.isArray(product?.imageVariants) && product.imageVariants.length > 0
      ? product.imageVariants.filter(
          (image: any) =>
            image && typeof image.url === "string" && image.url.trim().length > 0,
        )
      : Array.isArray(product?.images) && product.images.length > 0
        ? product.images
            .filter(
              (image: unknown): image is string =>
                typeof image === "string" && image.trim().length > 0,
            )
            .map((url: string, index: number) => ({
              url,
              index,
              name: product?.imageLabels?.[index] || `Design ${index + 1}`,
            }))
        : typeof product?.image === "string" && product.image.trim().length > 0
          ? [{ url: product.image, index: 0, name: "Main Image" }]
          : [];

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    setSelectedImage(0);
    if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize(null);
    }
  }, [product?._id]);

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await axios.get(`/api/products/${productId}/reviews`);
        setReviews(res.data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) {
      toast.error("Please fill out your name and review comment.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post(`/api/products/${productId}/reviews`, {
        name: reviewerName,
        rating,
        comment,
      });
      if (res.data.success) {
        toast.success("Review submitted successfully!");
        setReviews([res.data.review, ...reviews]);
        setReviewerName("");
        setRating(5);
        setComment("");

        // Update product ratings locally
        const newReviews = [res.data.review, ...reviews];
        const totalRating = newReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = parseFloat((totalRating / newReviews.length).toFixed(1));
        setProduct((prev: any) => prev ? { ...prev, ratings: avgRating } : prev);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchProduct = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await axios.get(`/api/products/${productId}`);
      setProduct(res.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
      setErrorMessage(
        "Product not found or unavailable right now. Please try again.",
      );
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!product) {
      setRelatedProducts([]);
      setValuePacks([]);
      setSuggestionsLoading(false);
      return;
    }

    const categoryId = product?.category?._id || product?.category;

    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        // 1. Fetch other products (filtered by category if present, or latest products)
        const prodUrl = categoryId
          ? `/api/products?category=${categoryId}&limit=8&sort=-createdAt`
          : `/api/products?limit=8&sort=-createdAt`;

        const prodRes = await axios.get(prodUrl);
        const prodList = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data?.products || [];

        const filteredProds = prodList.filter((item: any) => item?._id !== product._id);
        setRelatedProducts(filteredProds);

        // 2. Fetch Value Pack suggestions
        const vpRes = await axios.get(`/api/products?valuePack=true&limit=6&sort=-createdAt`);
        const vpList = Array.isArray(vpRes.data)
          ? vpRes.data
          : vpRes.data?.products || [];

        const filteredVps = vpList.filter((item: any) => item?._id !== product._id);
        setValuePacks(filteredVps);
      } catch (error) {
        console.error("Error fetching product suggestions:", error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [product]);

  const heroImage =
    productImageVariants[selectedImage]?.url ||
    productImageVariants[0]?.url ||
    (typeof product?.image === "string" && product.image.trim().length > 0 ? product.image : null) ||
    (Array.isArray(product?.images) && product.images.find((img: any) => typeof img === "string" && img.trim().length > 0)) ||
    "/logo.png";

  const currentPrice = selectedSize?.price ?? product?.price ?? 0;
  const currentOriginalPrice = selectedSize?.originalPrice ?? product?.originalPrice;

  const handleSelectImage = (index: number) => {
    if (index < 0 || index >= productImageVariants.length) return;
    setIsMainImageLoaded(false);
    setSelectedImage(index);
  };

  const handleAddToCart = () => {
    addItem({
      _id: product._id,
      name: product.name,
      price: currentPrice,
      quantity,
      image: productImageVariants[selectedImage]?.url || productImageVariants[0]?.url || "",
      size: selectedSize?.name,
    });
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success("Link copied!");
    } catch (_err) {
      toast.error("Failed to copy link");
    }

    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
    }
    setSharePopup("Link copied!");
    shareTimeoutRef.current = setTimeout(() => setSharePopup(null), 2200);
  };

  useEffect(() => {
    return () => {
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
    };
  }, []);

  const benefitsList: string[] = Array.isArray(product?.keyBenefits)
    ? product.keyBenefits.filter(Boolean)
    : typeof product?.keyBenefits === "string"
      ? product.keyBenefits.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
      : [];

  const ingredientsList: string[] = Array.isArray(product?.naturalIngredients)
    ? product.naturalIngredients.filter(Boolean)
    : typeof product?.naturalIngredients === "string"
      ? product.naturalIngredients.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
      : [];

  if (isLoading) {
    return <ProductSkeleton />;
  }

  if (errorMessage || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-neutral-800">
          {errorMessage || "Product not found."}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchProduct}
            className="px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-900"
          >
            Retry
          </button>
          <button
            onClick={() => router.push("/products")}
            className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-800 hover:border-neutral-500"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": productImageVariants.map((v: any) => v.url),
    "description": product.description || product.name,
    "sku": product._id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Homy Organic",
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "PKR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
    },
    ...(product.ratings > 0
      ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.ratings,
            "reviewCount": reviews.length || 1,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen py-6 sm:py-10 bg-white">
      {/* Google Rich Snippets SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Tagline */}
        <div className="text-center py-1">
          <p className="text-[10px] tracking-[0.3em] font-semibold text-gray-400 uppercase">
            PURE • NATURAL • PREMIUM
          </p>
        </div>

        {/* Main Product Hero Grid - Frameless No-Card Design */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Image (Auto Size, No Card Box, No Border) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center justify-center">
              {heroImage && (
                <img
                  src={heroImage}
                  alt={product.name}
                  loading="eager"
                  fetchPriority="high"
                  className="w-auto h-auto max-w-full max-h-[480px] object-contain transition-all duration-300"
                />
              )}

              {/* Thumbnails if multiple */}
              {productImageVariants.length > 1 && (
                <div className="flex items-center justify-center gap-2.5 mt-5">
                  {productImageVariants.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectImage(idx)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        selectedImage === idx ? "border-black opacity-100" : "border-gray-200 opacity-50 hover:opacity-100"
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-contain p-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Title, Price & Description (SEO Optimized) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 pt-2">
            <div className="space-y-4">
              <p className="text-xs tracking-[0.25em] font-bold text-[#B9853A] uppercase">
                {product.isValuePack ? (product.badge || "VALUE PACK") : (product.category?.name || "ORGANIC")} {product.brand ? `• ${product.brand}` : ""}
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              {product.ratings > 0 && (
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex text-amber-400 text-xs gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < Math.round(product.ratings) ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {reviews.length} {reviews.length === 1 ? "customer review" : "customer reviews"}
                  </span>
                </div>
              )}

              {/* Price Tag */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#E55353]">
                  {formatPrice(currentPrice)}
                </span>
                {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                  <span className="text-sm font-normal text-gray-400 line-through">
                    {formatPrice(currentOriginalPrice)}
                  </span>
                )}
              </div>

              {/* Size Selector Options */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Select Size / Option:
                    </span>
                    {selectedSize?.name && (
                      <span className="text-xs font-semibold text-[#B9853B]">
                        Selected: {selectedSize.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {product.sizes.map((s: any, idx: number) => {
                      const isSelected = selectedSize?.name === s.name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? "border-[#B9853B] bg-[#B9853B] text-white shadow-md scale-105"
                              : "border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          <span>{s.name}</span>
                          {s.price && (
                            <span className={isSelected ? "text-amber-100 font-normal" : "text-gray-500 font-normal"}>
                              ({formatPrice(s.price)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clean Description Header */}
              {product.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm sm:text-base text-gray-700 font-normal leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-100">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-full px-3 py-1 space-x-3 bg-gray-50/60">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-gray-500 hover:text-black font-bold text-sm px-1 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-gray-500 hover:text-black font-bold text-sm px-1 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons (Minimal, Smooth & Sleek) */}
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 bg-black hover:bg-neutral-900 active:scale-[0.97] text-white px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wider transition-all duration-200 shadow-md cursor-pointer text-center"
                >
                  <FiShoppingCart className="w-4 h-4 text-white" />
                  <span>Add to Cart</span>
                </button>

                <div className="relative inline-block">
                  {sharePopup && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-black text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{sharePopup}</span>
                    </div>
                  )}

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-gray-200 hover:border-black active:scale-95 text-xs font-semibold text-gray-800 hover:text-black transition-all cursor-pointer bg-white shrink-0 shadow-sm hover:shadow"
                    title="Share / Copy Product Link"
                  >
                    <FiShare2 className="w-3.5 h-3.5 text-gray-600" />
                    <span className="hidden sm:inline">Share / Copy Link</span>
                    <span className="sm:hidden">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Pack Included Items */}
        {product.isValuePack &&
          Array.isArray(product.whichIncluded) &&
          product.whichIncluded.length > 0 && (
            <div className="pt-6 border-t border-amber-200/80">
              <div className="bg-[#FAF6F0] p-6 sm:p-7 rounded-2xl border border-[#EADBCC] shadow-md hover:shadow-lg transition-all space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-lg sm:text-xl">🎁</span>
                  <span>Items Included in this Value Pack</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {product.whichIncluded.map((item: any, idx: number) => {
                    const isObject = typeof item === "object" && item !== null;
                    const itemName = isObject ? item.name : String(item);
                    const itemQty = isObject && typeof item.quantity === "number" ? item.quantity : 1;
                    const itemPrice = isObject && typeof item.price === "number" ? item.price : undefined;

                    return (
                      <li key={idx} className="flex items-center justify-between gap-3 text-sm sm:text-base text-gray-800 font-semibold bg-white p-3.5 sm:p-4 rounded-xl border border-amber-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#B9853A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {itemQty}x
                          </span>
                          <span className="font-bold text-gray-900">{itemName}</span>
                        </div>
                        {itemPrice !== undefined && (
                          <span className="text-xs sm:text-sm font-semibold text-[#B9853A] bg-amber-50 px-3 py-1 rounded-md border border-amber-200/60 shrink-0">
                            {formatPrice(itemPrice)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

        {/* Organic Details Cards (Standard Products) */}
        {!product.isValuePack &&
          (benefitsList.length > 0 ||
          ingredientsList.length > 0 ||
          (typeof product.howToUse === "string" && product.howToUse.trim().length > 0) ||
          (typeof product.precautions === "string" && product.precautions.trim().length > 0) ||
          (typeof product.ourQuality === "string" && product.ourQuality.trim().length > 0)) && (
          <div className="pt-10 border-t border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#B9853A] font-bold">
                  ORGANIC SPECIFICATIONS
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-1">
                  Product Details & Guide
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Key Benefits Card */}
              {benefitsList.length > 0 && (
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/80 shadow-md hover:shadow-xl transition-all space-y-4">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider flex items-center">
                    <span className="w-2 h-5 bg-[#C59B27] rounded-full mr-3 inline-block" />
                    Key Benefits
                  </h3>
                  <ul className="space-y-3 pt-1">
                    {benefitsList.map((b: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-gray-700 font-medium leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#E5F5EB] text-[#2E7D32] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Natural Ingredients Card (List View) */}
              {ingredientsList.length > 0 && (
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/80 shadow-md hover:shadow-xl transition-all space-y-4">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider flex items-center">
                    <span className="w-2 h-5 bg-[#C59B27] rounded-full mr-3 inline-block" />
                    Natural Ingredients
                  </h3>
                  <ul className="space-y-2.5 pt-1">
                    {ingredientsList.map((ing: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm sm:text-base text-gray-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#B9853A] shrink-0" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* How to Use Card */}
              {typeof product.howToUse === "string" && product.howToUse.trim().length > 0 && (
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/80 shadow-md hover:shadow-xl transition-all space-y-4">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider flex items-center">
                    <span className="w-2 h-5 bg-[#C59B27] rounded-full mr-3 inline-block" />
                    How to Use
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed whitespace-pre-line pt-1">
                    {product.howToUse}
                  </p>
                </div>
              )}

              {/* Precautions Green Card */}
              {typeof product.precautions === "string" && product.precautions.trim().length > 0 && (
                <div className="bg-[#F0FDF4] p-6 sm:p-7 rounded-2xl border border-[#BBF7D0] shadow-md hover:shadow-xl transition-all space-y-4">
                  <h3 className="text-sm sm:text-base font-bold text-[#15803D] uppercase tracking-wider flex items-center">
                    <span className="w-2 h-5 bg-[#16A34A] rounded-full mr-3 inline-block" />
                    Precautions & Safety
                  </h3>
                  <p className="text-sm sm:text-base text-[#166534] font-medium leading-relaxed whitespace-pre-line pt-1">
                    {product.precautions}
                  </p>
                </div>
              )}

              {/* Our Quality Card */}
              {typeof product.ourQuality === "string" && product.ourQuality.trim().length > 0 && (
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/80 shadow-md hover:shadow-xl transition-all space-y-4 md:col-span-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider flex items-center">
                    <span className="w-2 h-5 bg-[#2E5B3E] rounded-full mr-3 inline-block" />
                    Our Quality Assurance
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed whitespace-pre-line pt-1">
                    {product.ourQuality}
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Reviews Section - Flat (No Card Box) */}
        <section className="pt-8 border-t border-gray-200 space-y-6">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-semibold">
              Customer Feedback
            </p>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              Reviews
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Reviews List */}
            <div className={isLoggedIn ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
              {reviewsLoading ? (
                <p className="text-sm text-gray-400 font-light animate-pulse">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-400 font-light italic">No reviews yet. Be the first to leave one!</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {reviews.slice(0, visibleReviews).map((rev) => (
                      <div key={rev._id} className="border-b border-gray-100 pb-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">{rev.name}</h4>
                          <span className="text-xs text-gray-400 font-light">
                            {new Date(rev.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex text-yellow-500 text-xs">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 font-light leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {reviews.length > visibleReviews && (
                      <button
                        onClick={() => setVisibleReviews((prev) => prev + 3)}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-gray-500 hover:text-black border border-gray-300 hover:border-black rounded-full px-4 py-2 transition-colors cursor-pointer bg-transparent"
                      >
                        See More ({reviews.length - visibleReviews} remaining)
                      </button>
                    )}
                    {visibleReviews > 3 && (
                      <button
                        onClick={() => setVisibleReviews(3)}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-gray-500 hover:text-black border border-gray-300 hover:border-black rounded-full px-4 py-2 transition-colors cursor-pointer bg-transparent"
                      >
                        Show Less
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Submission Form (Only Rendered When Logged-in) */}
            {isLoggedIn && (
              <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-md hover:shadow-lg transition-all">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-1">
                  Write a Review
                </h3>
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="reviewerName" className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="reviewerName"
                      value={reviewerName || session?.user?.name || ""}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-200 bg-white text-xs rounded-lg focus:outline-none focus:border-black transition-colors font-medium text-gray-900"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                      Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-lg focus:outline-none transition-colors cursor-pointer ${
                            star <= rating ? "text-amber-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="comment" className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                      Review Comment
                    </label>
                    <textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 bg-white text-xs focus:outline-none focus:border-black rounded-lg resize-none transition-colors font-medium text-gray-900"
                      placeholder="Write your thoughts here..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-400 cursor-pointer"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Recommended Value Packs / Bundles Suggestions */}
        {!suggestionsLoading && valuePacks.length > 0 && (
          <section className="pt-8 border-t border-gray-200 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#B9853A] font-bold">
                  SPECIAL BUNDLES
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Recommended Value Packs
                </h2>
              </div>
              <Link
                href="/products?valuePacks=true"
                className="text-xs font-semibold text-gray-600 hover:text-black transition-colors underline underline-offset-4"
              >
                View All Packs →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {valuePacks.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}

        {/* Other Organic Products Suggestions */}
        {!suggestionsLoading && relatedProducts.length > 0 && (
          <section className="pt-8 border-t border-gray-200 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-semibold">
                  YOU MAY ALSO LIKE
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Other Products
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-gray-600 hover:text-black transition-colors underline underline-offset-4"
              >
                Explore Shop →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Sticky Mobile Add to Cart Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
            {product.name}
          </span>
          <span className="text-sm font-bold text-[#E55353]">
            {formatPrice(currentPrice)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="flex-1 max-w-[190px] inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 active:scale-95 text-white px-5 py-3 rounded-full text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <FiShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
