"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowUpRight, FiSearch } from "react-icons/fi";

type Product = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  images?: string[];
};

export default function ProductSearchSuggest({
  autoFocus,
  onClose,
  placeholder = "Search products...",
}: {
  autoFocus?: boolean;
  onClose?: () => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const firstImage = (p: Product) => {
    if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) return p.images[0];
    if (typeof p.image === "string" && p.image.trim()) return p.image;
    return "/homyorganic.png";
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setOpen(true);
    setLoading(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=6`,
        );
        const data = await res.json();
        setResults(data?.products || []);
        setOpen(true);
      } catch (err) {
        console.error("Search error", err);
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const goTo = (id: string) => {
    setOpen(false);
    router.push(`/products/${id}`);
    onClose?.();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative border-b border-gray-200">
        <FiSearch
          className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400"
          size={24}
          strokeWidth={1.5}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (query.trim() || results.length > 0) && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className="w-full bg-transparent text-gray-900 pl-11 pr-4 py-4 md:py-5 text-xl md:text-2xl font-light placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
          aria-label="Search products"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white max-h-[70vh] overflow-y-auto w-full">
          <div className="flex items-center justify-between px-2 py-4 border-b border-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
              Suggestions
            </p>
          </div>

          <div className="">
            {loading && (
              <div className="p-3 space-y-2.5">
                <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-base text-gray-500 font-light">
                  No matches found for{" "}
                  <span className="font-medium text-gray-900">"{query}"</span>
                </p>
              </div>
            )}

            {!loading &&
              results.map((p) => (
                <button
                  key={p._id}
                  onClick={() => goTo(p.slug || p._id)}
                  className="w-full text-left flex items-center justify-between cursor-pointer py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors group pl-2 pr-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                      <img
                        src={firstImage(p)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-gray-900 group-hover:text-black transition-colors">
                        {p.name}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                        View Product
                      </span>
                    </div>
                  </div>
                  <FiArrowUpRight
                    size={20}
                    className="text-gray-300 group-hover:text-black transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    strokeWidth={1.5}
                  />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
