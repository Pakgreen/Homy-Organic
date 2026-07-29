import React from "react";

interface ProductSkeletonProps {
  count?: number;
}

export default function ProductSkeleton({ count = 5 }: ProductSkeletonProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Title skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-36 bg-gray-200/80 rounded-md animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex flex-col space-y-3 bg-white">
            {/* Image card placeholder */}
            <div className="relative aspect-4/5 w-full bg-gray-200/80 rounded-lg overflow-hidden animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>

            {/* Details placeholders */}
            <div className="space-y-2 pt-1">
              <div className="h-2.5 bg-gray-200/80 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-200/80 rounded w-4/5 animate-pulse" />
              <div className="h-3 bg-gray-200/80 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200/80 rounded w-2/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
