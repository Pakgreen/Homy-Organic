"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import AdminDeleteModal from "@/components/AdminDeleteModal";
import { useSession } from "next-auth/react";

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    showInNav: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.categories || [];
      setCategories(data);
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory._id}`, formData);
        toast.success("Category updated successfully");
      } else {
        await axios.post("/api/categories", formData);
        toast.success("Category created successfully");
      }
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save category");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/categories/${deletingCategory._id}`);
      toast.success("Category deleted successfully");
      setDeletingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      showInNav: category.showInNav !== undefined ? category.showInNav : true,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      showInNav: true,
    });
  };



  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Categories</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage product groupings and nav links</p>
          </div>
          {categories.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: "#B9853A" }}>
              {categories.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setEditingCategory(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer w-fit"
          style={{ backgroundColor: "#B9853A" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#a07230")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#B9853A")}
        >
          <FiPlus size={15} strokeWidth={2.5} />
          Add Category
        </button>
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF6EC] flex items-center justify-center mb-4">
            <FiPlus size={24} style={{ color: "#B9853A" }} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No categories yet</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            Start by creating your first category to organize products.
          </p>
          <button
            onClick={() => { setEditingCategory(null); resetForm(); setShowModal(true); }}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: "#B9853A" }}
          >
            Create Category
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any, index: number) => {
            const colors = [
              { bg: "#FDF6EC", text: "#B9853A" },
              { bg: "#EEF3FB", text: "#3A7BD5" },
              { bg: "#EEF8F2", text: "#2DA44E" },
              { bg: "#F3F0FF", text: "#8B5CF6" },
              { bg: "#FFF0F0", text: "#EF4444" },
              { bg: "#F0FAFA", text: "#0D9488" },
            ];
            const color = colors[index % colors.length];
            const initials = category.name?.slice(0, 2).toUpperCase() || "CA";
            return (
              <div
                key={category._id}
                className="group bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {category.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      category.showInNav !== false
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    {category.showInNav !== false ? "In Nav" : "Hidden"}
                  </span>
                </div>

                <div className="h-px bg-gray-50" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 rounded-lg transition-all cursor-pointer"
                  >
                    <FiEdit size={11} /> Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setDeletingCategory(category)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    >
                      <FiTrash2 size={11} /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.18)", backdropFilter: "blur(4px)" }}
        >
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => { setShowModal(false); setEditingCategory(null); resetForm(); }} />

          {/* Modal Card */}
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#B9853A] font-semibold mb-0.5">
                  {editingCategory ? "Edit" : "New"}
                </p>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h3>
              </div>
              <button
                onClick={() => { setShowModal(false); setEditingCategory(null); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg font-light cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  placeholder="e.g. Organic Oils"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Description <span className="text-gray-300 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-none"
                  placeholder="Short description of this category..."
                />
              </div>

              {/* Show in Nav toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Show in Navigation</p>
                  <p className="text-xs text-gray-400 mt-0.5">Display in the main menu</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showInNav}
                    onChange={(e) => setFormData({ ...formData, showInNav: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B9853A]"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer"
                  style={{ backgroundColor: "#B9853A" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#a07230")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#B9853A")}
                >
                  {editingCategory ? "Update Category" : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingCategory(null); resetForm(); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminDeleteModal
        isOpen={!!deletingCategory}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This will affect products assigned to it."
        itemName={deletingCategory?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteCategory}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  );
}
