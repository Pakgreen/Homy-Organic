"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { isCloudinaryUrl } from "@/lib/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface CategoryWithImage {
  _id: string;
  name: string;
  image: string;
}

export default function CategoryNav() {
  const [categories, setCategories] = useState<CategoryWithImage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchCategoriesWithImages();
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const fetchCategoriesWithImages = async () => {
    try {
      const catRes = await axios.get("/api/categories");
      const catData = Array.isArray(catRes.data)
        ? catRes.data
        : Array.isArray(catRes.data?.categories)
          ? catRes.data.categories
          : [];

      const visibleCategories = catData
        .filter((c: any) => c.showInNav !== false)
        .slice(0, 12);

      const categoriesWithImages: CategoryWithImage[] = await Promise.all(
        visibleCategories.map(async (cat: any) => {
          try {
            const prodRes = await axios.get(
              `/api/products?category=${cat._id}&limit=1&sort=-createdAt`
            );
            const products = Array.isArray(prodRes.data)
              ? prodRes.data
              : prodRes.data?.products || [];
            const firstImage = products[0]?.images?.[0] || "";
            return { _id: cat._id, name: cat.name, image: firstImage };
          } catch {
            return { _id: cat._id, name: cat.name, image: "" };
          }
        })
      );

      setCategories(categoriesWithImages);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <h2 className="text-2xl p-2 font-light text-center tracking-tight text-white md:text-4xl">
                   Shop by 
{" "}
          <span className="font-serif italic text-[#B9853B]">
            Category
          </span>
        </h2>
        <div className="relative group/slider">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 border border-gray-200 text-gray-600 hover:text-black hover:border-black transition-all cursor-pointer !rounded-full -ml-2"
              aria-label="Scroll left"
            >
              <FiChevronLeft size={18} />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 border border-gray-200 text-gray-600 hover:text-black hover:border-black transition-all cursor-pointer !rounded-full -mr-2"
              aria-label="Scroll right"
            >
              <FiChevronRight size={18} />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 sm:gap-8 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2"
          >
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/products?category=${category._id}`}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-black transition-colors relative">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="96px"
                      unoptimized={isCloudinaryUrl(category.image)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-lg font-light">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-600 group-hover:text-black transition-colors text-center max-w-[80px] sm:max-w-[96px] truncate">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}