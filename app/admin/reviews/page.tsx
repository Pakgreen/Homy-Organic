"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FiTrash2,
  FiExternalLink,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
} from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AdminDeleteModal from "@/components/AdminDeleteModal";

const ITEMS_PER_PAGE = 10;

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingReview, setDeletingReview] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/admin/reviews");
      setReviews(res.data.reviews || res.data);
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteReview = async () => {
    if (!deletingReview) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/admin/reviews/${deletingReview._id}`);
      toast.success("Review deleted successfully");
      setDeletingReview(null);
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReviews = reviews.filter((review: any) => {
    const q = searchQuery.toLowerCase();
    const productName = review.product?.name?.toLowerCase() || "";
    const reviewerName = review.name?.toLowerCase() || "";
    const commentText = review.comment?.toLowerCase() || "";
    const ratingStr = String(review.rating || "");
    return (
      productName.includes(q) ||
      reviewerName.includes(q) ||
      commentText.includes(q) ||
      ratingStr.includes(q)
    );
  });

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE) || 1;
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6 w-full">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Reviews
          </h2>
          <p className="text-sm text-gray-600 mt-1 font-light">
            Manage customer feedback and ratings
          </p>
        </div>
        {reviews.length > 0 && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full w-fit">
            Total Reviews: {reviews.length}
          </span>
        )}
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <FiSearch
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by reviewer, product, or comment..."
          className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-black transition-colors placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
          >
            <FiX size={13} />
          </button>
        )}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse font-light">
          Loading reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400 italic font-light border border-dashed border-gray-200 bg-white rounded-xl space-y-2">
          <FiMessageSquare size={24} className="mx-auto text-gray-300" />
          <p>
            {searchQuery ? `No reviews found matching "${searchQuery}"` : "No reviews submitted yet."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-medium text-gray-900 underline underline-offset-2 cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 overflow-hidden shadow-xs rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 text-[10px] uppercase tracking-widest font-semibold text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Product</th>
                    <th className="px-6 py-4 text-left">Reviewer</th>
                    <th className="px-6 py-4 text-left">Rating</th>
                    <th className="px-6 py-4 text-left">Comment</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedReviews.map((review) => {
                    const product = review.product || {};
                    const productImage = product.images?.[0] || "/logo.png";
                    return (
                      <tr
                        key={review._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Product */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 shrink-0 border border-gray-100 overflow-hidden rounded bg-white">
                              <Image
                                src={productImage}
                                alt={product.name || "Product"}
                                fill
                                className="object-contain"
                                sizes="40px"
                              />
                            </div>
                            <div className="max-w-[200px]">
                              <p className="font-medium text-gray-900 truncate">
                                {product.name || "Unknown Product"}
                              </p>
                              {product._id && (
                                <Link
                                  href={`/products/${product._id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-black uppercase tracking-wider font-semibold mt-0.5"
                                >
                                  View <FiExternalLink size={10} />
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Reviewer */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            {review.name}
                          </span>
                        </td>
                        {/* Rating */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex text-yellow-500 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>
                                {i < review.rating ? "★" : "☆"}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                            {review.rating} / 5
                          </span>
                        </td>
                        {/* Comment */}
                        <td className="px-6 py-4">
                          <p className="text-gray-600 font-light max-w-sm line-clamp-3 leading-relaxed">
                            {review.comment}
                          </p>
                        </td>
                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <button
                            onClick={() => setDeletingReview(review)}
                            className="text-gray-400 hover:text-red-600 p-2 hover:bg-gray-100/50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            title="Delete Review"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredReviews.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 bg-white px-4 py-3 border border-gray-200 rounded-xl text-xs">
              <span className="text-gray-500 font-medium">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)} of{" "}
                {filteredReviews.length} reviews
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <FiChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          currentPage === pageNum
                            ? "bg-black text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span>Next</span>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <AdminDeleteModal
        isOpen={!!deletingReview}
        title="Delete Review?"
        description="Are you sure you want to delete this customer review? It will be removed from the product detail page."
        itemName={deletingReview?.name ? `Review by ${deletingReview.name}` : "Customer Review"}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteReview}
        onClose={() => setDeletingReview(null)}
      />
    </div>
  );
}
