"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import axios from "axios";

export default function ValuePacksContent() {
  const [valuePacks, setValuePacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchValuePacks();
  }, []);

  const fetchValuePacks = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/products?valuePack=true&limit=10&sort=order");
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];
      const sorted = [...payload].sort(
        (a: any, b: any) => (a.order ?? 1) - (b.order ?? 1)
      );
      setValuePacks(sorted);
    } catch (error) {
      console.error("Error fetching value packs:", error);
      setValuePacks([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Silent load
  }

  if (valuePacks.length === 0) {
    return null; // Don't render section if no value packs are created
  }

  return (
    <section className="w-full py-8 sm:py-12 bg-[#FAF6F0]/60 border-y border-[#F0E6D8] my-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Title */}
        <div className="flex flex-col gap-2 border-b border-[#EADBCC] pb-4">
            <h2 className="text-4xl font-light tracking-tight text-white md:text-6xl text-left">
         Special Bundles{" "}
          <span className="font-serif italic text-[#B9853B]">
            Exclusive Deals
          </span>
        </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium text-left">
            Curated organic care bundles for extra savings & complete wellness.
          </p>
        </div>

        {/* Value Pack Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {valuePacks.map((product) => (
            <div key={product._id} className="w-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
