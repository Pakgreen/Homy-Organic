"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import axios from "axios";
import HeroSlider from "@/components/HeroSlider";
import { FiChevronLeft, FiChevronRight, FiArrowRight } from "react-icons/fi";
import Link from "next/link";

const CategorySlider = ({
  title,
  categoryId,
  products,
  isLoading,
}: {
  title: string;
  categoryId?: string;
  products: any[];
  isLoading: boolean;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const skeletons = Array.from({ length: 4 });

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group mb-1 sm:mb-2">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h2 className="text-base sm:text-xl font-semibold capitalize">
          {title}
        </h2>

        {/* Desktop Navigation Arrows */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={scrollLeft}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={scrollRight}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Products Carousel */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        {isLoading ? (
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
          >
            {skeletons.map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse space-y-3 min-w-50 w-[50vw] sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)] shrink-0 snap-start"
              >
                <div className="aspect-4/5 bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              const slider = scrollContainerRef.current;
              if (!slider) return;

              let startX = e.pageX - slider.offsetLeft;
              let scrollLeft = slider.scrollLeft;

              const handlePointerMove = (e: PointerEvent) => {
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 2; // scroll-fast
                slider.scrollLeft = scrollLeft - walk;
              };

              const handlePointerUp = () => {
                window.removeEventListener("pointermove", handlePointerMove);
                window.removeEventListener("pointerup", handlePointerUp);
              };

              window.addEventListener("pointermove", handlePointerMove);
              window.addEventListener("pointerup", handlePointerUp);
            }}
          >
            {products.map((product: any) => (
              <div
                key={product._id}
                className="min-w-50 w-[50vw] sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)] shrink-0 snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found</p>
          </div>
        )}
      </div>

      {/* View More Link */}
      {!isLoading && products.length > 0 && categoryId && (
        <div className="flex justify-center mt-3 mb-6">
          <Link
            href={`/products?category=${categoryId}`}
            className="flex items-center gap-2 text-sm font-bold border border-black rounded-full tracking-widest text-yellow-500 hover:text-gray-600 transition-colors py-2 px-6  hover:border-gray-600"
          >
             See More
          
          </Link>
        </div>
      )}
    </div>
  );
};

export default function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sortBy = "-createdAt";

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchWithRetry = async (url: string, attempts = 2) => {
    let lastError: unknown = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await axios.get(url);
      } catch (error) {
        lastError = error;
        if (i === attempts - 1) throw error;
      }
    }
    throw lastError;
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch up to 100 featured products to group them nicely
      const url = `/api/products?sort=${sortBy}&featured=true&limit=100`;
      const res = await fetchWithRetry(url, 2);
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];

      // If featured query returns empty, fall back to latest products
      if (!payload.length) {
        const fallback = await fetchWithRetry(
          `/api/products?sort=${sortBy}&limit=50`,
          2,
        );
        const fallbackPayload = Array.isArray(fallback.data)
          ? fallback.data
          : fallback.data?.products || [];
        setProducts(fallbackPayload);
        return;
      }

      setProducts(payload);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group products by their category
  const groupedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const groups: {
      [key: string]: { name: string; id?: string; items: any[] };
    } = {};

    products.forEach((product) => {
      const catName = product?.category?.name || "Featured Products";
      const catId =
        typeof product?.category === "object"
          ? product?.category?._id
          : product?.category;

      if (!groups[catName]) {
        groups[catName] = { name: catName, id: catId, items: [] };
      }
      // Only keep up to 12 items per category
      if (groups[catName].items.length < 12) {
        groups[catName].items.push(product);
      }
    });

    return Object.values(groups);
  }, [products]);

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <CategorySlider
            title="Featured Products"
            products={[]}
            isLoading={true}
          />
        </div>
      ) : groupedProducts.length > 0 ? (
        groupedProducts.map((group, index) => (
          <div key={group.name}>
            <div
              className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0 ${index === 0 ? "pt-8 sm:pt-10" : "pt-0"}`}
            >
              <CategorySlider
                title={group.name}
                categoryId={group.id}
                products={group.items}
                isLoading={false}
              />
            </div>
            {index === 0 && (
              <div className="mb-2 mt-0 sm:mb-3 sm:mt-1">
                <HeroSlider position="after_row_1" />
              </div>
            )}
            {index === 1 && (
              <div className="mb-2 mt-0 sm:mb-3 sm:mt-1">
                <HeroSlider position="after_row_2" />
              </div>
            )}
            {index === 2 && (
              <div className="mb-2 mt-0 sm:mb-3 sm:mt-1">
                <HeroSlider position="after_row_3" />
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No featured products found</p>
        </div>
      )}
    </div>
  );
}
