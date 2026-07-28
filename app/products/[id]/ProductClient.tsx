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
import { isCloudinaryUrl } from "@/lib/image";
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
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
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
  const productImageVariants = Array.isArray(product?.imageVariants)
    ? product.imageVariants.filter(
        (image: any) => image && typeof image.url === "string" && image.url.trim().length > 0,
      )
    : Array.isArray(product?.images)
      ? product.images
          .filter(
            (image: unknown): image is string =>
              typeof image === "string" && image.trim().length > 0,
          )
          .map((url: string, index: number) => ({
            url,
            index,
            name: `Design ${index + 1}`,
          }))
      : [];

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    setSelectedImage(0);
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
    const categoryId = product?.category?._id || product?.category;

    if (!product || !categoryId) {
      setRelatedProducts([]);
      setRelatedLoading(false);
      return;
    }

    const fetchRelatedProducts = async () => {
      setRelatedLoading(true);
      try {
        const res = await axios.get(
          `/api/products?category=${categoryId}&limit=8&sort=-createdAt`,
        );

        const payload = Array.isArray(res.data)
          ? res.data
          : res.data?.products || [];

        const related = payload.filter((item: any) => item?._id !== product._id);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Error fetching related products:", error);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  const heroImage = productImageVariants[selectedImage]?.url || productImageVariants[0]?.url || "/logo.png";

  const handleSelectImage = (index: number) => {
    if (index < 0 || index >= productImageVariants.length) return;
    setSelectedImage(index);
  };

  const handleAddToCart = () => {
    addItem({
      _id: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: productImageVariants[selectedImage]?.url || productImageVariants[0]?.url || "",
    });
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("Link copied");
      }
    } catch (_err) {
      toast.error("Failed to copy link");
    }

    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
    }
    setSharePopup(url);
    shareTimeoutRef.current = setTimeout(() => setSharePopup(null), 2000);
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/products")}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest hover:text-black border border-gray-300 hover:border-black rounded-full px-4 py-2 transition-colors mb-8 cursor-pointer bg-transparent"
        >
          &larr; Back to products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-tr-[3rem] rounded-bl-[3rem]">
              {heroImage && (
                <Image
                  src={heroImage}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized={isCloudinaryUrl(heroImage)}
                  priority
                />
              )}
            </div>

            {productImageVariants.length > 1 && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-semibold">
                      Select Design
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Choose the design you want to preview.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    {selectedImage + 1}/{productImageVariants.length}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {productImageVariants.map((image: any, index: number) => {
                    const isActive = selectedImage === index;
                    const imageLabel = image.name || `Design ${index + 1}`;

                    return (
                      <button
                        key={`${image.url}-${index}`}
                        type="button"
                        onClick={() => handleSelectImage(index)}
                        className={`group relative aspect-square overflow-hidden !rounded-md border transition-colors ${
                          isActive
                            ? "border-black"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        aria-label={`Select ${imageLabel}`}
                        aria-pressed={isActive}
                      >
                        <Image
                          src={image.url}
                          alt={`${product.name} ${imageLabel}`}
                          fill
                          className="object-contain bg-white"
                          sizes="120px"
                          unoptimized={isCloudinaryUrl(image.url)}
                        />

                        <div
                          className={`absolute inset-x-0 bottom-0 flex items-center justify-center px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                            isActive
                              ? "bg-black text-white"
                              : "bg-white/90 text-gray-700"
                          }`}
                        >
                          {isActive ? "Selected" : imageLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:pt-2">
            <div className="max-w-xl space-y-5">
              <div>
                {product.brand && (
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                    {product.brand}
                  </p>
                )}
                <h1 className="text-xl sm:text-3xl font-light text-gray-900 leading-tight tracking-tight">
                  {product.name}
                </h1>
                {product.ratings > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-yellow-500 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>
                          {i < Math.round(product.ratings) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {product.ratings} / 5 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
                <p className="mt-6 text-sm text-gray-500 font-light leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                  Price
                </p>
                <p className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">
                  {formatPrice(product.price)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">
                    Quantity
                  </p>
                  <div className="inline-flex flex-row items-center border border-gray-200 bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="cursor-pointer h-10 w-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-gray-900 border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="cursor-pointer h-10 w-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 relative pt-6 border-t border-gray-100">
                {sharePopup && (
                  <div className="absolute -top-14 left-0 bg-black text-white px-3 py-2 text-[10px] uppercase tracking-widest max-w-full">
                    <p className="font-semibold">Link copied</p>
                  </div>
                )}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 cursor-pointer border border-gray-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-900 hover:border-black transition-colors bg-white hover:bg-gray-50"
                >
                  <FiShare2 size={16} />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleAddToCart}
                  className="inline-flex flex-1 items-center justify-center cursor-pointer gap-2 bg-black text-white text-[10px] font-semibold uppercase tracking-widest py-3 hover:bg-gray-900 transition-colors"
                >
                  <FiShoppingCart size={16} />
                  <span>Add to Cart</span>
                </button>
              </div>

              {/* Delivery Estimate */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 text-gray-400">
                    <FiTruck size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-1">
                      Standard Delivery
                    </h4>
                    <p className="text-sm font-light text-gray-500">
                      Delivered within 3 - 5 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organic Details Section (Key Benefits, Ingredients, How to Use, Precautions, Our Quality) */}
        {( (benefitsList.length > 0) ||
           (ingredientsList.length > 0) ||
           product.howToUse || product.precautions || product.ourQuality ) && (
          <section className="mt-12 border-t border-gray-100 pt-10">
            <div className="flex flex-col gap-1 mb-6">
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold" style={{ color: "#B9853A" }}>
                Pure & Natural
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Product Details & Benefits
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Key Benefits - Sequence List */}
              {benefitsList.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 md:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#B9853A" }} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Key Benefits</h3>
                  </div>
                  <ol className="space-y-2">
                    {benefitsList.map((benefit: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-800 leading-relaxed bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                        <span className="w-5 h-5 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#B9853A" }}>
                          {idx + 1}
                        </span>
                        <span className="pt-0.5 font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Selected Natural Ingredients */}
              {ingredientsList.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#B9853A" }} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Selected Natural Ingredients</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ingredientsList.map((ing: string, idx: number) => (
                      <span key={idx} className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#FDF6EC] text-[#B9853A] border border-[#F5E6CE] shadow-2xs">
                        🌱 {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* How to Use */}
              {product.howToUse && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#B9853A" }} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">How to Use</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{product.howToUse}</p>
                </div>
              )}

              {/* Precautions */}
              {product.precautions && (
                <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">Precautions</h3>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-line">{product.precautions}</p>
                </div>
              )}

              {/* Our Quality Commitment */}
              {product.ourQuality && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2 md:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#B9853A" }} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Our Quality Commitment</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{product.ourQuality}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex flex-col gap-1 mb-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-semibold">
              Customer Feedback
            </p>
            <h2 className="text-lg font-light text-gray-900 tracking-tight">
              Reviews
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
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

            {/* Submission Form */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-1">
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
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                    className="w-full px-0 py-2 border-b border-gray-200 bg-transparent text-sm focus:outline-none focus:border-black transition-colors"
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
                        className={`text-xl focus:outline-none transition-colors cursor-pointer !rounded-none ${
                          star <= rating ? "text-yellow-500" : "text-gray-300"
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
                    className="w-full px-3 py-2 border border-gray-200 bg-transparent text-sm focus:outline-none focus:border-black rounded-md resize-none transition-colors"
                    placeholder="Write your thoughts here..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white text-[10px] font-semibold uppercase tracking-widest py-2.5 hover:bg-gray-900 transition-colors disabled:bg-gray-400 cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {!relatedLoading && relatedProducts.length > 0 && (
          <section className="mt-14 border-t border-gray-100 pt-10">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-semibold">
                  Related Products
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-light text-gray-900 tracking-tight">
                  You may also like
                </h2>
              </div>
              {product?.category?.name && (
                <span className="hidden sm:inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  {product.category.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item._id}
                  product={item}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
