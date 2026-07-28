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
    <div className="min-h-screen py-6 sm:py-8 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Top Header Label */}
        <div className="text-center py-1">
          <p className="text-[10px] tracking-[0.3em] font-semibold text-gray-400 uppercase">
            PURE • NATURAL • PREMIUM
          </p>
        </div>

        {/* Main Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Product Image */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100/80 relative flex flex-col items-center justify-center h-full min-h-[380px] sm:min-h-[450px]">
              {product.isFeatured && (
                <span className="absolute top-6 left-6 bg-white border border-gray-200 text-[10px] font-bold text-gray-900 px-3 py-1 rounded-full uppercase tracking-wider">
                  FEATURED
                </span>
              )}

              <div className="relative w-full aspect-square max-h-[360px] sm:max-h-[420px]">
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

              {/* Thumbnails if multiple */}
              {productImageVariants.length > 1 && (
                <div className="flex items-center gap-2.5 mt-4">
                  {productImageVariants.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectImage(idx)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === idx ? "border-black" : "border-gray-100 opacity-60"
                      }`}
                    >
                      <Image src={img.url} alt="" fill className="object-contain p-1" unoptimized={isCloudinaryUrl(img.url)} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Specs & Order Form */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100/80 h-full flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <p className="text-[10px] tracking-[0.25em] font-bold text-gray-400 uppercase">
                  {product.category?.name || "ORGANIC"} {product.brand ? `• ${product.brand}` : ""}
                </p>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1810] tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                {product.ratings > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-xs gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < Math.round(product.ratings) ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-[#E55353]">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm font-medium text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-xs text-gray-500 font-normal leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="space-y-5 pt-4 border-t border-gray-100">
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-700">Quantity</span>
                  <div className="flex items-center border border-gray-200 rounded-full px-3 py-1 space-x-3 bg-white">
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

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 sm:flex-initial bg-[#1A1A1A] hover:bg-black text-white px-8 py-3 rounded-full text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={() => useCartStore.getState().openCart()}
                    className="bg-[#FAF7F2] hover:bg-[#F2ECE4] text-gray-900 border border-gray-100 px-8 py-3 rounded-full text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Go to Cart
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Organic Details - 2 Column Layout (No Card Containers) */}
        {(benefitsList.length > 0 ||
          ingredientsList.length > 0 ||
          (typeof product.howToUse === "string" && product.howToUse.trim().length > 0) ||
          (typeof product.precautions === "string" && product.precautions.trim().length > 0) ||
          (typeof product.ourQuality === "string" && product.ourQuality.trim().length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 pt-6 border-t border-gray-200">
            
            {/* Key Benefits */}
            {benefitsList.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center">
                  <span className="w-1 h-4 bg-[#C59B27] rounded-full mr-2.5 inline-block" />
                  Key Benefits
                </h3>
                <ul className="space-y-2">
                  {benefitsList.map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 font-medium">
                      <span className="w-4 h-4 rounded-full bg-[#E5F5EB] text-[#2E7D32] flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selected Natural Ingredients */}
            {ingredientsList.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center">
                  <span className="w-1 h-4 bg-[#C59B27] rounded-full mr-2.5 inline-block" />
                  Selected Natural Ingredients
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ingredientsList.map((ing: string, i: number) => (
                    <span key={i} className="px-3 py-1 text-xs font-semibold rounded-full bg-[#FDF6EC] text-[#B9853A] border border-[#F5E6CE]">
                      🌱 {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* How to Use */}
            {typeof product.howToUse === "string" && product.howToUse.trim().length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center">
                  <span className="w-1 h-4 bg-[#C59B27] rounded-full mr-2.5 inline-block" />
                  How to Use
                </h3>
                <p className="text-xs text-gray-500 font-normal leading-relaxed whitespace-pre-line">
                  {product.howToUse}
                </p>
              </div>
            )}

            {/* Precautions */}
            {typeof product.precautions === "string" && product.precautions.trim().length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center">
                  <span className="w-1 h-4 bg-[#C59B27] rounded-full mr-2.5 inline-block" />
                  Precautions
                </h3>
                <p className="text-xs text-gray-600 font-normal leading-relaxed whitespace-pre-line">
                  {product.precautions}
                </p>
              </div>
            )}

            {/* Our Quality */}
            {typeof product.ourQuality === "string" && product.ourQuality.trim().length > 0 && (
              <div className="space-y-2.5 md:col-span-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center">
                  <span className="w-1 h-4 bg-[#2E5B3E] rounded-full mr-2.5 inline-block" />
                  Our Quality
                </h3>
                <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                  {product.ourQuality}
                </p>
              </div>
            )}

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
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100">
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
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 bg-white text-xs rounded-lg focus:outline-none focus:border-black transition-colors"
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
                    className="w-full px-3 py-2 border border-gray-200 bg-white text-xs focus:outline-none focus:border-black rounded-lg resize-none transition-colors"
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
          </div>
        </section>

        {!relatedLoading && relatedProducts.length > 0 && (
          <section className="pt-8 border-t border-gray-200 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-semibold">
                  Related Products
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  You may also like
                </h2>
              </div>
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
