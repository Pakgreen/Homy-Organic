"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
  FiShield,
  FiX,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import axios from "axios";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/ProductCard";
import { getOptimizedImageUrl } from "@/lib/image";

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
  initialProduct?: any;
}

export default function ProductClient({
  productId,
  initialProduct,
}: ProductClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [product, setProduct] = useState<any>(initialProduct || null);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [valuePacks, setValuePacks] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<any>(
    initialProduct?.sizes?.[0] || null,
  );
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const [sharePopup, setSharePopup] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("923023735860");
  const shareTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (Array.isArray(reviews) && reviews.length > 0) {
      reviews.forEach((r: any) => {
        const star = Math.min(
          5,
          Math.max(1, Math.round(Number(r.rating) || 5)),
        );
        counts[star as keyof typeof counts] += 1;
      });
    }
    return counts;
  }, [reviews]);
  const addItem = useCartStore((state) => state.addItem);
  const productImageVariants =
    Array.isArray(product?.imageVariants) && product.imageVariants.length > 0
      ? product.imageVariants.filter(
          (image: any) =>
            image &&
            typeof image.url === "string" &&
            image.url.trim().length > 0,
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
    if (showWriteReviewModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showWriteReviewModal]);

  useEffect(() => {
    if (
      !initialProduct ||
      (product && product._id !== productId && product.slug !== productId)
    ) {
      fetchProduct();
    }
    fetchWhatsappSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchWhatsappSetting = async () => {
    try {
      const res = await axios.get("/api/settings/site");
      if (res.data?.whatsappNumber) {
        setWhatsappNumber(res.data.whatsappNumber);
      } else if (res.data?.contact?.phone) {
        setWhatsappNumber(res.data.contact.phone);
      }
    } catch (e) {
      // Keep default
    }
  };

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
        const idToFetch = product?._id || productId;
        const res = await axios.get(`/api/products/${idToFetch}/reviews`);
        if (Array.isArray(res.data)) {
          setReviews(res.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [productId, product?._id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) {
      toast.error("Please fill out your name and review comment.");
      return;
    }
    setIsSubmitting(true);
    try {
      const idToSubmit = product?._id || productId;
      const res = await axios.post(`/api/products/${idToSubmit}/reviews`, {
        name: reviewerName,
        rating,
        comment,
      });
      if (res.data.success) {
        toast.success("Review submitted successfully!");
        setShowAllReviews(true);
        setReviewerName("");
        setRating(5);
        setComment("");

        // Re-fetch fresh reviews from server immediately
        try {
          const freshRes = await axios.get(`/api/products/${idToSubmit}/reviews`);
          if (Array.isArray(freshRes.data) && freshRes.data.length > 0) {
            setReviews(freshRes.data);
          } else if (res.data.review) {
            setReviews((prev) => [res.data.review, ...prev]);
          }
        } catch {
          if (res.data.review) {
            setReviews((prev) => [res.data.review, ...prev]);
          }
        }

        // Update product ratings locally
        const newReviews = [res.data.review, ...reviews];
        const totalRating = newReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = parseFloat(
          (totalRating / newReviews.length).toFixed(1),
        );
        setProduct((prev: any) =>
          prev ? { ...prev, ratings: avgRating } : prev,
        );
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

        const filteredProds = prodList.filter(
          (item: any) => item?._id !== product._id,
        );
        setRelatedProducts(filteredProds);

        // 2. Fetch Value Pack suggestions
        const vpRes = await axios.get(
          `/api/products?valuePack=true&limit=6&sort=-createdAt`,
        );
        const vpList = Array.isArray(vpRes.data)
          ? vpRes.data
          : vpRes.data?.products || [];

        const filteredVps = vpList.filter(
          (item: any) => item?._id !== product._id,
        );
        setValuePacks(filteredVps);
      } catch (error) {
        console.error("Error fetching product suggestions:", error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [product]);

  const calculatedRating = useMemo(() => {
    if (Array.isArray(reviews) && reviews.length > 0) {
      const sum = reviews.reduce(
        (acc: number, r: any) => acc + (Number(r.rating) || 5),
        0,
      );
      return parseFloat((sum / reviews.length).toFixed(1));
    }
    return typeof product?.ratings === "number" && product.ratings > 0
      ? product.ratings
      : 0;
  }, [reviews, product?.ratings]);

  const ratingCount =
    Array.isArray(reviews) && reviews.length > 0
      ? reviews.length
      : product?.numReviews || 0;

  const rawHeroImage =
    productImageVariants[selectedImage]?.url ||
    productImageVariants[0]?.url ||
    (typeof product?.image === "string" && product.image.trim().length > 0
      ? product.image
      : null) ||
    (Array.isArray(product?.images) &&
      product.images.find(
        (img: any) => typeof img === "string" && img.trim().length > 0,
      )) ||
    "/logo.png";

  const heroImage = getOptimizedImageUrl(rawHeroImage, 800, "auto");

  const currentPrice = selectedSize?.price ?? product?.price ?? 0;
  const currentOriginalPrice =
    selectedSize?.originalPrice ?? product?.originalPrice;

  const handleSelectImage = (index: number) => {
    if (index < 0 || index >= productImageVariants.length) return;
    setIsMainImageLoaded(false);
    setSelectedImage(index);
  };

  const isOutOfStock =
    product?.inStock === false ||
    (typeof product?.stock === "number" && product.stock <= 0);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("Sorry, this product is currently out of stock!");
      return;
    }
    addItem({
      _id: product._id,
      name: product.name,
      price: currentPrice,
      quantity,
      image:
        productImageVariants[selectedImage]?.url ||
        productImageVariants[0]?.url ||
        "",
      size: selectedSize?.name,
    });
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleWhatsAppOrder = () => {
    if (isOutOfStock) {
      toast.error("Sorry, this product is currently out of stock!");
      return;
    }
    const cleanPhone = (whatsappNumber || "923023735860").replace(
      /[^0-9]/g,
      "",
    );
    const priceToUse = selectedSize?.price
      ? selectedSize.price
      : typeof product?.newPrice === "number"
        ? product.newPrice
        : product?.price || 0;

    const pageUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://homyorganic.store/products/${product?.slug || product?._id}`;

    let message = `Hello Homy Organic! 👋\n\nI want to place an order for this product:\n\n`;
    message += `🛍️ *Product:* ${product?.name || "Product"}\n`;
    if (selectedSize?.name) {
      message += `🏷️ *Size / Option:* ${selectedSize.name}\n`;
    }
    message += `💰 *Unit Price:* ${formatPrice(priceToUse)}\n`;
    message += `🔢 *Quantity:* ${quantity}\n`;
    message += `💵 *Total Amount:* ${formatPrice(priceToUse * quantity)}\n`;
    message += `🔗 *Product Link:* ${pageUrl}\n\n`;
    message += `Please confirm my order. Thank you!`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
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
      ? product.keyBenefits
          .split(/\r?\n/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  const ingredientsList: string[] = Array.isArray(product?.naturalIngredients)
    ? product.naturalIngredients.filter(Boolean)
    : typeof product?.naturalIngredients === "string"
      ? product.naturalIngredients
          .split(/\r?\n/)
          .map((s: string) => s.trim())
          .filter(Boolean)
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
    name: product.name,
    image: productImageVariants.map((v: any) => v.url),
    description: product.description || product.name,
    sku: product._id,
    brand: {
      "@type": "Brand",
      name: product.brand || "Homy Organic",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
    },
    ...(product.ratings > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratings,
            reviewCount: reviews.length || 1,
          },
        }
      : {}),
  };

  const handlePrevImage = () => {
    if (productImageVariants.length <= 1) return;
    setSelectedImage((prev) =>
      prev === 0 ? productImageVariants.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    if (productImageVariants.length <= 1) return;
    setSelectedImage((prev) =>
      prev === productImageVariants.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <div className="min-h-screen py-6 sm:py-12 bg-white text-gray-900">
      {/* Google Rich Snippets SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Main Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left Side Gallery Container (Main Image Box + Thumbnails Below) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Main Product Image Container (No Container BG, No Shadow) */}
            <div className="relative flex items-center justify-center min-h-[360px] sm:min-h-[480px] group">
              {/* Main Image */}
              {heroImage && (
                <img
                  src={heroImage}
                  alt={product.name}
                  loading="eager"
                  fetchPriority="high"
                  className="w-auto h-auto max-w-full max-h-[460px] object-contain rounded-2xl transition-transform duration-300 group-hover:scale-105"
                />
              )}

              {/* Stock Badge (Out of Stock only) */}
              {isOutOfStock && (
                <span className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Product Thumbnails Placed Below Main Image (Strict 100% Sharp Square Boxes) */}
            {productImageVariants.length > 1 && (
              <div className="flex items-center justify-center gap-3 overflow-x-auto py-1 px-2">
                {productImageVariants.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectImage(idx)}
                    style={{ borderRadius: "0px" }}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 aspect-square !rounded-none overflow-hidden border-2 transition-all cursor-pointer bg-white p-1 shrink-0 ${
                      selectedImage === idx
                        ? " ring-2 ring-black/20 scale-105 shadow-sm opacity-100"
                        : "border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(img.url, 140, "auto:eco")}
                      alt=""
                      style={{ borderRadius: "0px" }}
                      className="w-full h-full object-contain !rounded-none"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Product Details & Action Buttons */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            {/* Brand / Store Header */}
            <p className="text-sm font-medium text-gray-500 tracking-tight">
              {product.brand || "Homy Organic"}
            </p>

            {/* Product Title & Share Button */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              <div className="relative shrink-0 pt-1">
                {sharePopup && (
                  <div className="absolute -top-8 right-0 z-30 bg-black text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                    {sharePopup}
                  </div>
                )}
                <button
                  onClick={handleShare}
                  type="button"
                  title="Share product"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all cursor-pointer text-xs font-medium border border-gray-200/80 active:scale-95"
                >
                  <FiShare2 className="w-3.5 h-3.5 text-gray-600" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Ratings from API */}
            {(calculatedRating > 0 || ratingCount > 0) && (
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400 text-sm gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < Math.round(calculatedRating) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-600 font-semibold">
                  {calculatedRating > 0 ? calculatedRating.toFixed(1) : "5.0"} (
                  {ratingCount} {ratingCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}

            {/* Price Tag */}
            <div className="flex items-baseline gap-3 pt-1">
              <span
                className="text-2xl sm:text-3xl font-medium text-gray-900"
                style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
              >
                {formatPrice(currentPrice)}
              </span>
              {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                <span
                  className="text-base font-normal text-gray-400 line-through"
                  style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                >
                  {formatPrice(currentOriginalPrice)}
                </span>
              )}
            </div>

            {/* Subtext: Shipping */}
            <p className="text-xs text-gray-500 font-normal">
              <span className="underline cursor-pointer">Shipping</span>{" "}
              calculated at checkout.
            </p>

            {/* In Stock Badge - Simple & Clean */}
            <div>
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Out of stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>In stock, ready to ship</span>
                </div>
              )}
            </div>

            {/* Product Description (Moved Up) */}
            {product.description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Size / Option Selector */}
            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Select Option / Variant:
                  </span>
                  {selectedSize?.name && (
                    <span className="text-xs font-medium text-gray-900">
                      Selected: {selectedSize.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.sizes.map((s: any, idx: number) => {
                    const isSelected = selectedSize?.name === s.name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "border-black bg-black text-white shadow-xs"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span>{s.name}</span>
                        {s.price && (
                          <span
                            className={
                              isSelected
                                ? "text-gray-300 font-normal"
                                : "text-gray-400 font-normal"
                            }
                          >
                            ({formatPrice(s.price)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart Row */}
            <div className="pt-3 space-y-3">
              {/* Simple Clean Discount Banner */}
              {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                <div className="text-xs font-semibold text-emerald-700 flex items-center justify-between bg-emerald-50/80 px-3.5 py-2 rounded-lg border border-emerald-100">
                  <span>
                    Save {formatPrice(currentOriginalPrice - currentPrice)} on
                    this item
                  </span>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {Math.round(
                      ((currentOriginalPrice - currentPrice) /
                        currentOriginalPrice) *
                        100,
                    )}
                    % OFF
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Quantity Box */}
                <div className="flex items-center justify-between border border-gray-300 rounded-xl px-4 py-3 w-32 shrink-0 bg-white text-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-gray-500 hover:text-black font-semibold text-sm cursor-pointer"
                  >
                    ‹
                  </button>
                  <span className="font-semibold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-gray-500 hover:text-black font-semibold text-sm cursor-pointer"
                  >
                    ›
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-200 text-center ${
                    isOutOfStock
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#181818] hover:bg-black active:scale-[0.98] text-white cursor-pointer shadow-sm"
                  }`}
                >
                  {isOutOfStock ? "Out of stock" : "Add to cart"}
                </button>
              </div>

              {/* Buy It Now / WhatsApp Button */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-6 rounded-xl border font-medium text-sm transition-all text-center flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-900 text-gray-900 hover:bg-gray-50 active:scale-[0.98] cursor-pointer"
                }`}
              >
                <FaWhatsapp className="w-4.5 h-4.5 text-[#25D366]" />
                <span>
                  {isOutOfStock ? "Out of stock" : "Order via WhatsApp"}
                </span>
              </button>

              {/* 15-Day Risk-Free Money Back Guarantee (Detailed Explanation, No Emojis) */}
              <div className=" border border-[#EADBCC] rounded-xl p-4 space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  <FiShield className="w-4 h-4 text-[#B9853A]" />
                  <span>15-Day Risk-Free Money Back Guarantee</span>
                </div>
                <p className="text-xs text-gray-600 font-normal leading-relaxed">
                  Try our product 100% risk-free. If you are not completely
                  satisfied with your purchase within 15 days of delivery,
                  simply contact our support for a hassle-free full refund.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Pack Included Items */}
        {product.isValuePack &&
          Array.isArray(product.whichIncluded) &&
          product.whichIncluded.length > 0 && (
            <div className="pt-8 border-t border-gray-100">
              <div className="p-6 rounded-2xl bg-[#F8F1EA]/50 border border-[#F0E6DA] space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Included Items in this Value Pack
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {product.whichIncluded.map((item: any, idx: number) => {
                    const isObject = typeof item === "object" && item !== null;
                    const itemName = isObject ? item.name : String(item);
                    const itemQty =
                      isObject && typeof item.quantity === "number"
                        ? item.quantity
                        : 1;
                    const itemPrice =
                      isObject && typeof item.price === "number"
                        ? item.price
                        : undefined;

                    return (
                      <li
                        key={idx}
                        className="flex items-center justify-between gap-3 text-xs sm:text-sm text-gray-800 font-medium p-3 rounded-xl bg-white border border-gray-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#B9853A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {itemQty}x
                          </span>
                          <span className="font-medium text-gray-900">
                            {itemName}
                          </span>
                        </div>
                        {itemPrice !== undefined && (
                          <span className="text-xs font-semibold text-gray-600">
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

        {/* Minimal Organic Specifications */}
        {!product.isValuePack &&
          (benefitsList.length > 0 ||
            ingredientsList.length > 0 ||
            (typeof product.howToUse === "string" &&
              product.howToUse.trim().length > 0) ||
            (typeof product.precautions === "string" &&
              product.precautions.trim().length > 0) ||
            (typeof product.ourQuality === "string" &&
              product.ourQuality.trim().length > 0)) && (
            <div className="pt-10 border-t border-gray-100 space-y-6">
              <div>
                <p className="font-serif italic text-sm sm:text-base text-[#B9853A]">
                  {product.name} Guide
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif italic text-gray-900 tracking-tight mt-0.5">
                  Product Details & Specifications
                </h2>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Central Infographic Connecting Lines (Crisp Gold Dashed Lines in Center Gap) */}
                <div className="flex absolute inset-0 pointer-events-none items-center justify-center z-0">
                  <div className="w-full border-t-2 border-dashed border-[#B9853A] absolute hidden md:block" />
                  <div className="h-full border-l-2 border-dashed border-[#B9853A] absolute" />
                </div>

                {/* Key Benefits */}
                {benefitsList.length > 0 && (
                  <div className="relative z-10 bg-white p-7 sm:p-8 pt-9 sm:pt-10 rounded-3xl border border-dashed border-[#EADBCC] hover:border-[#B9853A] transition-all duration-300 space-y-4 sm:space-y-5">
                    <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#B9853A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md border-2 border-white z-20">
                      01
                    </span>
                    <div className="text-center border-b border-dashed border-gray-200 pb-2.5">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 font-serif italic">
                        Key Benefits
                      </h3>
                    </div>
                    <ul className="space-y-3.5 pt-1">
                      {benefitsList.map((b: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3.5 text-sm sm:text-base text-gray-700 font-normal leading-relaxed"
                        >
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FAF3E8] text-[#B9853A] flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5 border border-[#EADBCC]">
                            ✓
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Natural Ingredients */}
                {ingredientsList.length > 0 && (
                  <div className="relative z-10 bg-white p-7 sm:p-8 pt-9 sm:pt-10 rounded-3xl border border-dashed border-[#EADBCC] hover:border-[#B9853A] transition-all duration-300 space-y-4 sm:space-y-5">
                    <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#B9853A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md border-2 border-white z-20">
                      02
                    </span>
                    <div className="text-center border-b border-dashed border-gray-200 pb-2.5">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 font-serif italic">
                        Natural Ingredients
                      </h3>
                    </div>
                    <div className="space-y-3 pt-1">
                      {ingredientsList.map((ing: string, i: number) => (
                        <p
                          key={i}
                          className="text-sm sm:text-base text-gray-700 font-normal leading-relaxed sm:leading-loose"
                        >
                          {ing}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* How to Use */}
                {typeof product.howToUse === "string" &&
                  product.howToUse.trim().length > 0 && (
                    <div className="relative z-10 bg-white p-7 sm:p-8 pt-9 sm:pt-10 rounded-3xl border border-dashed border-[#EADBCC] hover:border-[#B9853A] transition-all duration-300 space-y-4 sm:space-y-5">
                      <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#B9853A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md border-2 border-white z-20">
                        03
                      </span>
                      <div className="text-center border-b border-dashed border-gray-200 pb-2.5">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 font-serif italic">
                          How to Use
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 font-normal leading-relaxed sm:leading-loose whitespace-pre-line pt-1">
                        {product.howToUse}
                      </p>
                    </div>
                  )}

                {/* Precautions */}
                {typeof product.precautions === "string" &&
                  product.precautions.trim().length > 0 && (
                    <div className="relative z-10 bg-[#D1FAE5] p-7 sm:p-8 pt-9 sm:pt-10 rounded-3xl border border-dashed border-[#6EE7B7] transition-all duration-300 space-y-4 sm:space-y-5">
                      <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#065F46] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md border-2 border-white z-20">
                        04
                      </span>
                      <div className="text-center border-b border-dashed border-[#A7F3D0] pb-2.5">
                        <h3 className="text-lg sm:text-xl font-semibold text-[#065F46] font-serif italic">
                          Precautions & Safety
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-[#044E39] font-medium leading-relaxed sm:leading-loose whitespace-pre-line pt-1">
                        {product.precautions}
                      </p>
                    </div>
                  )}

                {/* Quality Assurance */}
                {typeof product.ourQuality === "string" &&
                  product.ourQuality.trim().length > 0 && (
                    <div className="relative z-10 bg-white p-7 sm:p-8 pt-9 sm:pt-10 rounded-3xl border border-dashed border-[#EADBCC] hover:border-[#B9853A] transition-all duration-300 space-y-4 sm:space-y-5 md:col-span-2">
                      <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#B9853A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md border-2 border-white z-20">
                        05
                      </span>
                      <div className="text-center border-b border-dashed border-gray-200 pb-2.5">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 font-serif italic">
                          Our Quality Assurance
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 font-normal leading-relaxed sm:leading-loose whitespace-pre-line pt-1">
                        {product.ourQuality}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Customer Review Section (Clean Normal Font Weights) */}
        <section className="pt-10 border-t border-gray-100 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 text-center tracking-tight">
            Customer <span className="font-serif italic text-[#B9853B]">Reviews</span>
          </h2>

          {/* Top Summary Card Container */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Column 1: Rating Score */}
            <div className="text-center md:text-left space-y-1 shrink-0 md:pr-8 md:border-r md:border-gray-100">
              <div className="text-3xl sm:text-4xl font-medium text-gray-900 tracking-tight">
                {calculatedRating > 0 ? calculatedRating.toFixed(1) : "5.0"}/5.0
              </div>
              <div className="flex text-amber-400 text-sm justify-center md:justify-start gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < Math.round(calculatedRating) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 font-normal">
                {ratingCount} {ratingCount === 1 ? "Review" : "Reviews"}
              </p>
            </div>

            {/* Column 2: Rating Distribution & See All Reviews */}
            <div className="flex-1 max-w-md w-full space-y-1.5 text-center">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  ratingDistribution[star as keyof typeof ratingDistribution] || 0;
                const percent = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-16 text-right font-normal shrink-0 flex items-center justify-end gap-0.5">
                      {[...Array(star)].map((_, i) => (
                        <span key={i} className="text-black text-[10px]">★</span>
                      ))}
                      {[...Array(5 - star)].map((_, i) => (
                        <span key={i} className="text-gray-300 text-[10px]">☆</span>
                      ))}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-4 text-right font-normal text-gray-700 text-xs shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="text-xs font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600 cursor-pointer transition-colors"
                >
                  {showAllReviews ? "Hide Reviews" : "See All Reviews"}
                </button>
              </div>
            </div>

            {/* Column 3: Write A Review Button */}
            <div className="shrink-0 md:pl-8 md:border-l md:border-gray-100 text-center">
              <button
                type="button"
                onClick={() => setShowWriteReviewModal(true)}
                className="bg-[#181818] hover:bg-black text-white text-xs sm:text-sm font-medium px-7 py-3 rounded-2xl transition-all cursor-pointer shadow-sm active:scale-98"
              >
                Write A Review
              </button>
            </div>
          </div>

          {/* Customer Reviews Cards Grid (Hidden by default, shown when 'See All Reviews' clicked) */}
          {showAllReviews && (
            <div className="space-y-4 pt-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-gray-500">
                  Showing {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-normal text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-2xs hover:bg-gray-50 cursor-pointer"
                >
                  <span>⇆ Sort</span>
                </button>
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-6">
                  No reviews submitted yet. Be the first to write a review!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                  {reviews.map((rev: any) => {
                    const initial = (rev.name || "N").charAt(0).toUpperCase();
                    return (
                      <div
                        key={rev._id}
                        className="relative bg-white p-5 rounded-3xl border border-gray-100 space-y-3 shadow-xs hover:shadow-md transition-shadow"
                      >
                        {/* Circle Avatar Initial Header */}
                        <div className="flex justify-center -mt-9">
                          <div className="w-12 h-12 rounded-full bg-gray-50 border-2 border-white shadow-sm flex items-center justify-center text-sm font-medium text-gray-800 uppercase">
                            {initial}
                          </div>
                        </div>

                        <div className="text-center space-y-1 pt-1">
                          <h4 className="text-xs font-medium text-gray-900">
                            {rev.name}
                          </h4>
                          <div className="flex justify-center text-black text-xs gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 font-normal leading-relaxed text-center">
                          {rev.comment}
                        </p>
                        
                        <p className="text-[10px] text-gray-400 text-center pt-1 font-normal">
                          {new Date(rev.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Write A Review Modal Popup (Centered, No Page Scroll, High Z-Index) */}
        {showWriteReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200 my-auto max-h-[85vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Write A Review
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWriteReviewModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Review Form */}
              <form
                onSubmit={async (e) => {
                  await handleReviewSubmit(e);
                  setShowWriteReviewModal(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reviewerName || session?.user?.name || ""}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${
                          star <= rating ? "text-amber-400" : "text-gray-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-gray-600 ml-2">
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Review Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={4}
                    placeholder="Share your experience with this product..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:border-black focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWriteReviewModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors disabled:bg-gray-300 cursor-pointer"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recommended Value Packs Suggestions */}
        {!suggestionsLoading && valuePacks.length > 0 && (
          <section className="pt-8 border-t border-gray-100 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="mt-0.5 text-xl sm:text-2xl font-light text-gray-900 tracking-tight">
                  Recommended <span className="font-serif italic text-[#B9853B]">Value Packs</span>
                </h2>
              </div>
              <Link
                href="/products?valuePack=true"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-black text-gray-800 hover:text-white transition-all text-xs font-medium border border-gray-200/80 active:scale-95 shrink-0"
              >
                <span>View All Packs</span>
                <span className="text-xs">→</span>
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
          <section className="pt-8 border-t border-gray-100 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight">
                  You May <span className="font-serif italic text-[#B9853B]">Also Like</span>
                </h2>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-black text-gray-800 hover:text-white transition-all text-xs font-medium border border-gray-200/80 active:scale-95 shrink-0"
              >
                <span>Explore Shop</span>
                <span className="text-xs">→</span>
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
          <span className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">
            {product.name}
          </span>
          <span
            className="text-sm font-bold text-gray-900"
            style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
          >
            {formatPrice(currentPrice)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="flex-1 max-w-[180px] inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 active:scale-95 text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer"
        >
          <FiShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
