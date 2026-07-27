"use client";

import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { FiShoppingBag, FiShare2 } from "react-icons/fi";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { siteConfig } from "@/config/site.config";
import { isCloudinaryUrl } from "@/lib/image";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    newPrice?: number;
    oldPrice?: number;
    originalPrice?: number;
    images: string[];
    ratings: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const primaryImage = product.images?.[0] || "";
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

  const handleAddToCart = () => {
    addItem({
      _id: product._id,
      name: product.name,
      price: currentPrice,
      quantity: 1,
      image: product.images[0] || "",
    });
    toast.success("Added to cart!");
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/products/${product._id}`;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
        return;
      }

      // Fallback copy for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Link copied");
    } catch (_error) {
      // Silently ignore to avoid noisy errors
    }
  };

  return (
    <article className="group/card flex h-full flex-col bg-white">
      <div className="relative h-64 sm:h-80 overflow-hidden bg-gray-100 ">
        {showOldPrice && (
          <div className="absolute top-3 left-3 z-10  text-yellow-500 border border-yellow-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest px-3 py-1 shadow-sm">
            Sale
          </div>
        )}
        <Link href={`/products/${product._id}`} className="absolute inset-0">
          {primaryImage && (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 75vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized={isCloudinaryUrl(primaryImage)}
                className={`object-cover transition-all duration-500 ${
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
                  sizes="(max-width: 640px) 75vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={isCloudinaryUrl(hoverImage)}
                  className="object-cover opacity-0 transition-all duration-500 group-hover/card:scale-105 group-hover/card:opacity-100"
                />
              )}
            </>
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col pt-3 items-center text-center">
        <Link href={`/products/${product._id}`}>
          <h3
            className="line-clamp-2 text-sm sm:text-base font-medium italic text-gray-700 leading-snug hover:text-black transition-colors"
          >
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex flex-col items-center justify-center gap-1 italic">
          <div className="flex items-center justify-center gap-2">
            {showOldPrice && previousPrice !== undefined && (
              <span className="text-xs sm:text-sm text-gray-400 line-through font-normal not-italic">
                {formatPrice(previousPrice)}
              </span>
            )}
            <span className="text-base sm:text-lg font-semibold text-gray-800 leading-none">
              {formatPrice(currentPrice)}
            </span>
          </div>
          {showOldPrice && previousPrice !== undefined && (
            <span className="text-[11px] sm:text-xs font-medium text-red-500 not-italic">
              Save {formatPrice(previousPrice - currentPrice)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="mt-3 w-full flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300  px-3 py-2 text-sm font-medium text-gray-700  focus:outline-none transition-colors hover:bg-black hover:text-white active:bg-gray-200"
        >
          <FiShoppingBag size={18} />
          Add to Cart
        </button>
      </div>
    </article>
  );
}