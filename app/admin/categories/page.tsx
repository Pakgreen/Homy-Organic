"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import { useSession } from "next-auth/react";

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will affect products in this category!"))
      return;
    try {
      await axios.delete(`/api/categories/${id}`);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category");
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
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6 w-full">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Categories
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-light">
            Manage product groupings and navigation links
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            resetForm();
            setShowModal(true);
          }}
          className="text-xs uppercase tracking-widest font-medium text-gray-900 hover:text-gray-500 border-b border-transparent hover:border-gray-500 transition-colors cursor-pointer pb-0.5 flex items-center gap-2"
        >
          <FiPlus strokeWidth={1.5} size={14} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category: any) => (
          <div
            key={category._id}
            className="group relative bg-white border border-gray-200 p-6 flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-shadow"
          >


            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-light text-lg text-gray-900 tracking-tight truncate">
                    {category.name}
                  </h3>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold border px-2 py-0.5 whitespace-nowrap ${category.showInNav !== false ? "border-green-200 text-green-700" : "border-gray-200 text-gray-500"}`}
                  >
                    {category.showInNav !== false ? "In Nav" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-light line-clamp-2 leading-relaxed">
                  {category.description || "No description provided."}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-[10px] uppercase tracking-widest cursor-pointer font-semibold text-gray-400 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <FiEdit size={12} /> Edit
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="text-[10px] uppercase tracking-widest cursor-pointer font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                  >
                    <FiTrash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-100 font-semibold mx-auto mt-6 sm:mt-10">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                  Category
                </div>
                <h3 className="text-xl font-extrabold">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-900 font-extrabold">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    placeholder="e.g. Electronics"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="block text-gray-900 font-extrabold">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input min-h-20"
                    placeholder="Optional short description"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-extrabold">
                    <input
                      type="checkbox"
                      checked={formData.showInNav}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          showInNav: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>Show in Navigation Bar</span>
                  </label>
                  <p className="text-xs text-gray-500 font-normal ml-6">
                    If checked, this category will appear in the main navigation
                    menu.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-gray-100">
                <button
                  type="submit"
                  className="px-8 py-3 bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors uppercase tracking-widest disabled:opacity-50"
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                  className="px-8 py-3 bg-transparent text-gray-500 border border-gray-200 text-xs font-medium hover:text-black hover:border-gray-500 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
