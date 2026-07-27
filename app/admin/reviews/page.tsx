"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiTrash2, FiExternalLink } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/admin/reviews");
      setReviews(res.data);
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await axios.delete(`/api/admin/reviews/${id}`);
      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6 w-full">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Reviews
          </h2>
          <p className="text-sm text-gray-600 mt-2 font-light">
            Manage customer feedback and ratings
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse font-light">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400 italic font-light border border-dashed border-gray-200 bg-white">
          No reviews submitted yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                {reviews.map((review) => {
                  const product = review.product || {};
                  const productImage = product.images?.[0] || "/logo.png";
                  return (
                    <tr key={review._id} className="hover:bg-gray-50/50 transition-colors">
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
                        <span className="font-semibold text-gray-900">{review.name}</span>
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
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <button
                          onClick={() => handleDelete(review._id)}
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
      )}
    </div>
  );
}
