"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { FiShoppingBag, FiEye } from "react-icons/fi";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { isCloudinaryUrl, getOptimizedImageUrl } from "@/lib/image";

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
    category?: any;
    brand?: string;
    badge?: string;
    isBestSeller?: boolean;
    isFeatured?: boolean;
    inStock?: boolean;
    stock?: number;
    weight?: string;
  };
  priority?: boolean;
  isBestSellerSection?: boolean;
}

export default function ProductCard({
  product,
  priority = false,
  isBestSellerSection = false,
}: ProductCardProps) {
  const [isPrimaryLoaded, setIsPrimaryLoaded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const rawPrimary = product.images?.[0] || "";
  const rawHover = product.images?.[1] || rawPrimary;
  const primaryImage = getOptimizedImageUrl(rawPrimary, 380);
  const hoverImage = getOptimizedImageUrl(rawHover, 380);
  const hasHoverImage = Boolean(product.images?.[1]);

  const currentPrice =
    typeof product.newPrice === "number" ? product.newPrice : product.price;
  const previousPrice =
    typeof product.oldPrice === "number"
      ? product.oldPrice
      : typeof product.originalPrice === "number"
        ? product.originalPrice
        : undefined;

  const hasSizes = Array.isArray((product as any).sizes) && (product as any).sizes.length > 0;
  const firstSize = hasSizes ? (product as any).sizes[0] : null;
  const cardPrice = firstSize && typeof firstSize.price === "number" ? firstSize.price : currentPrice;
  const cardOriginalPrice =
    firstSize && typeof firstSize.originalPrice === "number" && firstSize.originalPrice > 0
      ? firstSize.originalPrice
      : previousPrice;

  const showOldPrice =
    typeof cardOriginalPrice === "number" && cardOriginalPrice > cardPrice;

  const discountPercent =
    showOldPrice && cardOriginalPrice && cardOriginalPrice > cardPrice
      ? Math.round(((cardOriginalPrice - cardPrice) / cardOriginalPrice) * 100)
      : 0;

  const rawCategoryName =
    typeof product.category === "object" && product.category?.name
      ? product.category.name
      : typeof product.category === "string" && product.category
      ? product.category
      : product.badge && !["value pack", "value packs", "valuepack"].includes(product.badge.trim().toLowerCase())
      ? product.badge
      : "";

  // If category name matches "ORGANIC", "HOMY ORGANIC", "VALUE PACK", or empty, don't show it
  const isExcludedCategory =
    !rawCategoryName ||
    ["organic", "homy organic", "homyorganic", "value pack", "value packs", "valuepack"].includes(
      rawCategoryName.trim().toLowerCase()
    );

  const categoryName = isExcludedCategory ? "" : rawCategoryName;

  const customBadge = product.badge?.trim() || "";
  const isValuePackBadge = ["value pack", "value packs", "valuepack"].includes(customBadge.toLowerCase());

  const isOutOfStock =
    (product as any).inStock === false ||
    (typeof (product as any).stock === "number" && (product as any).stock <= 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("Sorry, this item is currently out of stock!");
      return;
    }
    addItem({
      _id: product._id,
      name: product.name,
      price: cardPrice,
      quantity: 1,
      image: product.images[0] || "",
      size: firstSize ? firstSize.name : undefined,
    });
    toast.success("Added to cart!");
  };

  return (
    <article className="group flex h-full flex-col bg-white">
      
      {/* Image Container */}
      <div className="relative aspect-4/5 w-full overflow-hidden bg-[#F4F1EA]">
        
        {/* Top-Left Admin Tag from Backend */}
        {customBadge && !isBestSellerSection ? (
          <div className="absolute top-3 left-3 z-10 bg-white text-black font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
            {customBadge}
          </div>
        ) : null}

        {/* Small Hardcoded Best Seller Badge (ONLY displayed inside Best Selling Section) */}
        {isBestSellerSection ? (
          <div className="absolute top-3 left-3 z-10 bg-white text-black font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
            BEST SELLER
          </div>
        ) : null}

        {/* Top-Right Out of Stock / Discount Pill Badge */}
        {isOutOfStock ? (
          <div className="absolute top-3 right-3 z-10 bg-red-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
            OUT OF STOCK
          </div>
        ) : showOldPrice && discountPercent > 0 ? (
          <div className="absolute top-3 right-3 z-10 bg-[#EA6925] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-2xs">
            -{discountPercent}%
          </div>
        ) : null}

        <Link href={`/products/${product.slug || product._id}`} className="absolute inset-0">
          {primaryImage && (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className={`object-cover transition-all duration-500 ${
                  hasHoverImage
                    ? "group-hover:opacity-0"
                    : "group-hover:scale-105"
                }`}
              />
              {hasHoverImage && (
                <Image
                  src={hoverImage}
                  alt={`${product.name} alternate view`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
              )}
            </>
          )}
        </Link>

        {/* Hover / Touch Action Buttons (Auto-visible on Mobile, Hover on Desktop) */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md sm:shadow-sm transition-colors ${
              isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                : "bg-white text-gray-900 hover:bg-black hover:text-white cursor-pointer"
            }`}
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
            aria-label={`Add ${product.name} to cart`}
          >
            <FiShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
          <Link
            href={`/products/${product.slug || product._id}`}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-md sm:shadow-sm hover:bg-black hover:text-white transition-colors"
            title="Quick View"
            aria-label={`Quick view ${product.name}`}
          >
            <FiEye className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>
        </div>

      </div>

      {/* Content Details Below Image */}
      <div className="flex flex-1 flex-col pt-3 pb-1 text-left space-y-1">
        
        {/* Category Label */}
        {categoryName && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {categoryName}
            </span>
          </div>
        )}

        {/* Title */}
        <Link href={`/products/${product.slug || product._id}`}>
          <h3 className="line-clamp-2 text-sm font-medium uppercase tracking-tight text-gray-900 leading-snug hover:text-[#B9853A] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating Stars (Shows rating if set, default 5.0 stars) */}
        {(() => {
          const ratingVal =
            typeof product.ratings === "number" && product.ratings > 0
              ? product.ratings
              : 5.0;
          return (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="flex text-amber-400 text-xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>
                    {star <= Math.round(ratingVal) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {Number(ratingVal).toFixed(1)}
              </span>
            </div>
          );
        })()}

        {/* Price Row */}
        <div className="flex items-baseline gap-2 pt-1 font-semibold text-sm">
          <span
            className="text-[#E55353] text-base font-price-syne"
            style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif", fontWeight: 600, fontStyle: "italic" }}
          >
            {formatPrice(cardPrice)}
          </span>
          {cardOriginalPrice && cardOriginalPrice > cardPrice && (
            <span
              className="text-xs text-gray-400 line-through font-normal font-price-syne"
              style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif", fontWeight: 600, fontStyle: "italic" }}
            >
              {formatPrice(cardOriginalPrice)}
            </span>
          )}
        </div>

      </div>

    </article>
  );
}