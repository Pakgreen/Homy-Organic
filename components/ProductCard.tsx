"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { FiShoppingBag, FiEye, FiX, FiCheck, FiMinus, FiPlus } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useCartStore } from "@/store/cartStore";
import { isCloudinaryUrl } from "@/lib/image";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug?: string;
    price: number;
    newPrice?: number;
    oldPrice?: number;
    originalPrice?: number;
    images: string[];
    ratings?: number;
    category?: { _id?: string; name?: string; slug?: string } | string;
    categoryName?: string;
    numReviews?: number;
    reviewsCount?: number;
    description?: string;
    isFeatured?: boolean;
    brand?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalQuantity, setModalQuantity] = useState(1);

  const primaryImage = product.images?.[0] || "/placeholder.jpg";
  const hoverImage = product.images?.[1] || primaryImage;
  const hasHoverImage = Boolean(product.images?.[1]);

  const currentPrice =
    typeof product.newPrice === "number" ? product.newPrice : product.price;

  const previousPrice =
    typeof product.oldPrice === "number"
      ? product.oldPrice
      : typeof product.originalPrice === "number"
        ? product.originalPrice
        : undefined;

  const showOldPrice =
    typeof previousPrice === "number" && previousPrice > currentPrice;

  const discountPercentage =
    showOldPrice && previousPrice
      ? Math.round(((previousPrice - currentPrice) / previousPrice) * 100)
      : null;

  // Format price helper matching Rs.1,450.00
  const formatRupees = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `Rs.${formatted}`;
  };

  // Determine category display name
  const categoryDisplayName = (() => {
    if (typeof product.category === "object" && product.category?.name) {
      return product.category.name;
    }
    if (typeof product.category === "string" && product.category.trim()) {
      return product.category;
    }
    if (product.categoryName) return product.categoryName;
    if (product.brand) return product.brand;
    return "HAIR CARE";
  })();

  // Ratings & reviews count
  const ratingValue = typeof product.ratings === "number" && product.ratings > 0 ? product.ratings : 5;
  const reviewsCount =
    product.reviewsCount ||
    product.numReviews ||
    21;

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addItem({
      _id: product._id,
      name: product.name,
      price: currentPrice,
      quantity: 1,
      image: primaryImage,
    });
    toast.success("Added to cart!");
  };

  const handleQuickViewAddToCart = () => {
    addItem({
      _id: product._id,
      name: product.name,
      price: currentPrice,
      quantity: modalQuantity,
      image: product.images?.[selectedImageIndex] || primaryImage,
    });
    toast.success(`Added ${modalQuantity} to cart!`);
    setQuickViewOpen(false);
  };

  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <article className="group/card relative flex h-full flex-col bg-white rounded-lg overflow-hidden border border-gray-100/70 shadow-xs hover:shadow-xl transition-all duration-300">
        {/* Product Image Area */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-[#f7f5f0]">
          {/* Top Left Badge: HOT SALE */}
          {(showOldPrice || product.isFeatured) && (
            <div className="absolute top-3 left-3 z-10 bg-white text-black font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md pointer-events-none">
              HOT SALE
            </div>
          )}

          {/* Top Right Badge: Percentage Discount */}
          {discountPercentage !== null && discountPercentage > 0 && (
            <div className="absolute top-3 right-3 z-10 bg-[#ea580c] text-white font-bold text-[11px] sm:text-xs px-2.5 py-1 rounded-full shadow-md pointer-events-none">
              -{discountPercentage}%
            </div>
          )}

          {/* Image Link & Hover Effect */}
          <Link href={`/products/${product._id}`} className="absolute inset-0 block">
            {primaryImage && (
              <>
                <Image
                  src={primaryImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized={isCloudinaryUrl(primaryImage)}
                  className={`object-cover object-center transition-all duration-700 ease-out ${
                    hasHoverImage
                      ? "group-hover/card:opacity-0"
                      : "group-hover/card:scale-105"
                  }`}
                />
                {hasHoverImage && (
                  <Image
                    src={hoverImage}
                    alt={`${product.name} alternate view`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={isCloudinaryUrl(hoverImage)}
                    className="object-cover object-center opacity-0 transition-all duration-700 ease-out group-hover/card:scale-105 group-hover/card:opacity-100"
                  />
                )}
              </>
            )}
          </Link>

          {/* Floating Action Buttons (Center Bottom of Image) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 opacity-0 group-hover/card:opacity-100 translate-y-3 group-hover/card:translate-y-0 transition-all duration-300 ease-out">
            {/* Quick Add To Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              title="Add to Cart"
              aria-label="Add to Cart"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-gray-800 shadow-md hover:shadow-lg flex items-center justify-center hover:bg-black hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <FiShoppingBag className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>

            {/* Quick View Button */}
            <button
              type="button"
              onClick={handleOpenQuickView}
              title="Quick View"
              aria-label="Quick View"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-gray-800 shadow-md hover:shadow-lg flex items-center justify-center hover:bg-black hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <FiEye className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Product Details Section (Left Aligned) */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 text-left items-start bg-white">
          {/* Category */}
          <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-1 line-clamp-1">
            {categoryDisplayName}
          </span>

          {/* Title */}
          <Link href={`/products/${product._id}`} className="block w-full">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide group-hover/card:text-amber-700 transition-colors line-clamp-2 leading-snug mb-1.5">
              {product.name}
            </h3>
          </Link>

          {/* Rating Stars & Reviews Count */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex text-amber-400 text-xs sm:text-sm gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.round(ratingValue) ? "text-amber-400" : "text-gray-200"}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {reviewsCount} reviews
            </span>
          </div>

          {/* Price Display */}
          <div className="mt-auto flex items-baseline gap-2.5">
            <span className="text-sm sm:text-base md:text-lg font-bold text-[#e54848] leading-none">
              {formatRupees(currentPrice)}
            </span>
            {showOldPrice && previousPrice !== undefined && (
              <span className="text-xs sm:text-sm text-gray-400 line-through font-normal">
                {formatRupees(previousPrice)}
              </span>
            )}
          </div>
        </div>
      </article>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setQuickViewOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setQuickViewOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 p-6 gap-6">
              {/* Product Gallery */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <Image
                    src={product.images?.[selectedImageIndex] || primaryImage}
                    alt={product.name}
                    fill
                    unoptimized={isCloudinaryUrl(product.images?.[selectedImageIndex] || primaryImage)}
                    className="object-cover"
                  />
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${
                          selectedImageIndex === idx
                            ? "border-amber-600"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={img}
                          alt=""
                          fill
                          unoptimized={isCloudinaryUrl(img)}
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  {categoryDisplayName}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 uppercase tracking-wide mb-2 leading-tight">
                  {product.name}
                </h2>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex text-amber-400 text-sm gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {reviewsCount} reviews
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-xl font-bold text-[#e54848]">
                    {formatRupees(currentPrice)}
                  </span>
                  {showOldPrice && previousPrice !== undefined && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatRupees(previousPrice)}
                    </span>
                  )}
                  {discountPercentage !== null && discountPercentage > 0 && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      Save {discountPercentage}%
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 mb-4">
                    {product.description}
                  </p>
                )}

                {/* Quantity Control */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-medium text-gray-700 uppercase">Qty:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      <FiMinus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-semibold text-gray-800">
                      {modalQuantity}
                    </span>
                    <button
                      onClick={() => setModalQuantity((q) => q + 1)}
                      className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2.5">
                  <button
                    onClick={handleQuickViewAddToCart}
                    className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <FiShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </button>

                  <Link
                    href={`/products/${product._id}`}
                    onClick={() => setQuickViewOpen(false)}
                    className="w-full text-center text-xs font-semibold text-gray-600 hover:text-black py-1 transition-colors"
                  >
                    View Full Product Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

