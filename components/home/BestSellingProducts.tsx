"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import axios from "axios";

export default function BestSellingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    setIsLoading(true);
    try {
      // First try fetching products marked as best sellers sorted by order
      const res = await axios.get("/api/products?bestSeller=true&limit=10&sort=order");
      let data = Array.isArray(res.data) ? res.data : res.data?.products || [];

      // Fallback: If no best seller product is manually marked yet, fetch top active products
      if (!data || data.length === 0) {
        const fallbackRes = await axios.get("/api/products?limit=5&sort=order");
        data = Array.isArray(fallbackRes.data)
          ? fallbackRes.data
          : fallbackRes.data?.products || [];
      }

      const sorted = [...data].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setProducts(sorted);
    } catch (error) {
      console.error("Error fetching best selling products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="w-full py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="flex flex-col items-center justify-center mb-8">
          <h2 className="text-4xl text-center md:px-22 font-light tracking-tight text-white md:text-6xl">
            Our{" "}
            <span className="font-serif italic text-[#B9853B]">
              Best Selling Products
            </span>
          </h2>
          <p className="text-center text-xs sm:text-sm text-gray-400 mt-2 max-w-xl font-light">
            Discover our customer favorites, handpicked for superior quality and organic purity.
          </p>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <ProductSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product: any, idx: number) => (
              <div key={product._id} className="w-full">
                <ProductCard
                  product={product}
                  isBestSellerSection={true}
                  priority={idx < 2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
