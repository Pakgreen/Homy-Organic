"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import LocalImageUpload from "@/components/LocalImageUpload";
import Image from "next/image";

interface Slider {
  _id: string;
  title: string;
  image: string;
  position: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
}

export default function AdminSlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    position: "top",
    buttonText: "",
    buttonLink: "",
    isActive: true,
  });

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    setIsLoading(true);
    try {
      // Fetch all sliders (including inactive) for admin panel
      const res = await axios.get("/api/sliders?all=true");
      // Handle both formats: array directly or object with sliders property
      const data = Array.isArray(res.data) ? res.data : res.data.sliders || [];
      setSliders(data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingSlider) {
        await axios.put(`/api/sliders/${editingSlider._id}`, {
          ...formData,
        });
      } else {
        await axios.post("/api/sliders", {
          ...formData,
        });
      }
      setShowModal(false);
      setEditingSlider(null);
      resetForm();
      await fetchSliders();
    } catch (error: any) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slider?")) return;
    setIsLoading(true);
    try {
      await axios.delete(`/api/sliders/${id}`);

      await fetchSliders();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (slider: Slider) => {
    setEditingSlider(slider);
    setFormData({
      title: slider.title,
      image: slider.image,
      position: slider.position || "top",
      buttonText: "",
      buttonLink: "",
      isActive: slider.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      image: "",
      position: "top",
      buttonText: "",
      buttonLink: "",
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="h-8 w-48 bg-gray-100 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="h-48 bg-gray-100 w-full" />
              <div className="h-4 bg-gray-100 w-1/3" />
              <div className="h-3 bg-gray-100 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-xl font-light text-gray-900 uppercase tracking-widest">
            Manage Sliders
          </h2>
          <p className="mt-2 text-xs text-gray-400 uppercase tracking-widest">
            CONFIGURE HERO AND PROMOTIONAL BANNERS
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSlider(null);
            resetForm();
            setShowModal(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <FiPlus /> Add Slider
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sliders.map((slider) => (
          <div
            key={slider._id}
            className="group flex flex-col border-b border-gray-100 pb-6 last:border-0"
          >
            <div className="relative h-48 w-full bg-gray-50 border border-gray-100 mb-4 overflow-hidden">
              <Image
                src={slider.image}
                alt={slider.title}
                fill
                className="object-cover mix-blend-multiply"
              />
              {!slider.isActive && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-900 border border-gray-900 px-3 py-1 bg-white/90">
                    Inactive
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-light text-gray-500 mb-2 uppercase tracking-widest">
                  {slider.position === "after_row_1"
                    ? "After 1st Row"
                    : slider.position === "after_row_2"
                      ? "After 2nd Row"
                      : slider.position === "after_row_3"
                        ? "After 3rd Row"
                        : "Top (Main Hero)"}
                </p>
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-widest break-words leading-relaxed">
                  {slider.title || "Untitled"}
                </h3>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-50">
                <button
                  onClick={() => handleEdit(slider)}
                  className="flex flex-1 items-center justify-center py-2 text-[10px] font-medium text-gray-600 hover:text-black border border-gray-200 hover:border-gray-900 transition-colors uppercase tracking-widest cursor-pointer"
                >
                  <FiEdit className="mr-2" size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(slider._id)}
                  className="flex flex-1 items-center justify-center py-2 text-[10px] font-medium text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 hover:bg-red-50 transition-colors uppercase tracking-widest cursor-pointer"
                >
                  <FiTrash2 className="mr-2" size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
        >
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={() => {
              setShowModal(false);
              setEditingSlider(null);
              resetForm();
            }}
          />

          {/* Modal Card */}
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90dvh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "#B9853A" }}>
                  {editingSlider ? "Edit" : "New"}
                </p>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingSlider ? "Edit Slider" : "Add Slider"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingSlider(null);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg font-light cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="px-5 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Slider Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Summer Collection 2026"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Slider Image <span className="text-red-400">*</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Recommended ratio: 1920 × 800 px (3:1)
                  </p>
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-center">
                    <div className="w-full max-w-sm aspect-[3/1]">
                      <LocalImageUpload
                        value={formData.image}
                        onChange={(url) =>
                          setFormData({ ...formData, image: url })
                        }
                        onRemove={() => setFormData({ ...formData, image: "" })}
                      />
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Display Position
                  </label>
                  <select
                    value={formData.position || "top"}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all text-gray-900"
                  >
                    <option value="top">Top (Main Hero Slider)</option>
                    <option value="after_row_1">After 1st Category Row</option>
                    <option value="after_row_2">After 2nd Category Row</option>
                    <option value="after_row_3">After 3rd Category Row</option>
                  </select>
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Active Status</p>
                    <p className="text-xs text-gray-400 mt-0.5">Show this slider on the store</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B9853A]"></div>
                  </label>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="px-5 pb-5 pt-2 border-t border-gray-100 flex gap-3 shrink-0">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "#B9853A" }}
                  onMouseEnter={(e) =>
                    !isLoading && (e.currentTarget.style.backgroundColor = "#a07230")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#B9853A")
                  }
                >
                  {isLoading
                    ? "Processing..."
                    : editingSlider
                      ? "Update Slider"
                      : "Create Slider"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSlider(null);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all cursor-pointer"
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
