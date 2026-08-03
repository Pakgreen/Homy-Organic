"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Loading from "@/components/Loading";
import Breadcrumb from "@/components/Breadcrumb";
import axios from "axios";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden bg-white">
      <div className="h-52 sm:h-64 bg-gray-100" />
      <div className="p-3 space-y-3">
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const sortBy = "order";

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const search = searchParams?.get("search") || "";
      const category = searchParams?.get("category") || "";
      const isValuePack =
        searchParams?.get("valuePack") === "true" ||
        searchParams?.get("valuePacks") === "true";
      const isBestSeller = searchParams?.get("bestSeller") === "true";

      let url = `/api/products?sort=${sortBy}`;

      if (search) {
        url += `&search=${search}`;
      }

      if (category) {
        url += `&category=${category}`;
      }

      if (isValuePack) {
        url += `&valuePack=true`;
      } else if (isBestSeller) {
        url += `&bestSeller=true`;
      } else {
        url += `&regularOnly=true`;
      }

      const res = await axios.get(url);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];
      const sorted = [...data].sort(
        (a: any, b: any) => (a.order ?? 1) - (b.order ?? 1)
      );
      setProducts(sorted as any);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setErrorMessage("Unable to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.categories)
          ? res.data.categories
          : [];
      const map: Record<string, string> = {};
      list.forEach((c: any) => {
        if (c?._id && c?.name) {
          map[c._id] = c.name;
        }
      });
      setCategoryMap(map);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategoryMap({});
    }
  };

  const isValuePack =
    searchParams?.get("valuePack") === "true" ||
    searchParams?.get("valuePacks") === "true";

  const categoryId = searchParams?.get("category") as string;
  const headingText = isValuePack
    ? "Value Packs & Bundles"
    : categoryId
      ? categoryMap[categoryId] || "Products"
      : "All Products";

  if (isLoading) {
    const skeletons = Array.from({ length: 8 });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Breadcrumb items={[{ name: "Products", url: "/products" }]} />
        <div className="mb-8 mt-2">
          <h1 className="text-xl md:text-2xl font-bold mb-2 capitalize">
            {headingText}
          </h1>
          <p className="text-gray-600">Loading products...</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {skeletons.map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <Breadcrumb items={[{ name: headingText, url: "/products" }]} />
      <div className="mb-8 mt-2">
        <h1 className="text-xl md:text-2xl font-bold mb-4 capitalize">
          {headingText}
        </h1>
        {searchParams?.get("search") && (
          <p className="text-gray-600">
            Search results for:{" "}
            <span className="font-semibold">{searchParams?.get("search")}</span>
          </p>
        )}
        {errorMessage && (
          <div className="mt-3 text-sm text-red-600">
            {errorMessage}
            <button className="ml-3 underline" onClick={fetchProducts}>
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsClient() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsContent />
    </Suspense>
  );
}
