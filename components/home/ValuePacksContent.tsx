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
      const res = await axios.get("/api/products?valuePack=true&limit=10");
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];
      setValuePacks(payload);
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#EADBCC] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#B9853A] uppercase tracking-widest mb-1">
              <span>🎁 Special Bundles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Exclusive Value Packs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
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
