"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import axios from "axios";

export default function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sortBy = "order";

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
      // Fetch all active regular products continuously sorted by order
      const url = `/api/products?regularOnly=true&sort=${sortBy}&limit=100`;
      const res = await fetchWithRetry(url, 2);
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];

      const sorted = [...payload].sort(
        (a: any, b: any) => (a.order ?? 1) - (b.order ?? 1)
      );
      setProducts(sorted);
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
        <ProductSkeleton count={10} />
      ) : productRows.length > 0 ? (
        productRows.map((rowItems, rowIndex) => (
          <div key={rowIndex}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              {rowIndex === 0 && (
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-4xl text-center md:px-2  font-light tracking-tight text-white md:text-6xl">
            Our{" "}
            <span className="font-serif italic text-[#B9853B]">
             Premium Collection
            </span>
          </h2>
                </div>
              )}

              {/* 5-Column Grid Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {rowItems.map((product: any) => (
                  <div key={product._id} className="w-full">
                    <ProductCard product={product} priority={rowIndex === 0} />
                  </div>
                ))}
              </div>
            </div>
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
