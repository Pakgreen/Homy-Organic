"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import axios from "axios";
import HeroSlider from "@/components/HeroSlider";

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
      // Fetch all active products continuously
      const url = `/api/products?sort=${sortBy}&limit=100`;
      const res = await fetchWithRetry(url, 2);
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];

      setProducts(payload);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chunk products into rows of 5 items each (full 5-column grid per row on desktop)
  const productRows = useMemo(() => {
    if (!products || products.length === 0) return [];
    const rows: any[][] = [];
    const chunkSize = 5; // 5 items per row
    for (let i = 0; i < products.length; i += chunkSize) {
      rows.push(products.slice(i, i + chunkSize));
    }
    return rows;
  }, [products]);

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="animate-pulse space-y-3">
                <div className="aspect-4/5 bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : productRows.length > 0 ? (
        productRows.map((rowItems, rowIndex) => (
          <div key={rowIndex}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              {rowIndex === 0 && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    Our Products
                  </h2>
                </div>
              )}

              {/* 5-Column Grid Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {rowItems.map((product: any) => (
                  <div key={product._id} className="w-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>

            {/* Banner Sliders inserted after rows */}
            {rowIndex === 0 && (
              <div className="my-3 sm:my-4">
                <HeroSlider position="after_row_1" />
              </div>
            )}
            {rowIndex === 1 && (
              <div className="my-3 sm:my-4">
                <HeroSlider position="after_row_2" />
              </div>
            )}
            {rowIndex === 2 && (
              <div className="my-3 sm:my-4">
                <HeroSlider position="after_row_3" />
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found</p>
        </div>
      )}
    </div>
  );
}
