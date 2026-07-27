"use client";

import { FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProductSearchSuggest from "@/components/ProductSearchSuggest";

export default function SearchPage() {
  const router = useRouter();

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <main className="h-dvh w-full overflow-hidden bg-white z-50 fixed inset-0">
      <div className="h-full w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProductSearchSuggest
              autoFocus
              placeholder="What are you looking for?"
            />
          </div>
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 cursor-pointer hover:text-black transition-colors rounded-full"
            aria-label="Close search"
            title="Close"
          >
            <FiX size={28} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </main>
  );
}
