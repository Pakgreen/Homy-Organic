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
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 md:p-12 min-h-screen flex flex-col pt-24">
            <div className="mb-12 border-b border-gray-200 pb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-light text-gray-900 uppercase tracking-widest">
                  {editingSlider ? "Edit Slider" : "Add New Slider"}
                </h3>
                <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">
                  UPLOAD IMAGE AND SET DISPLAY POSITION
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingSlider(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-black transition-colors cursor-pointer"
              >
                <span className="text-[10px] uppercase tracking-widest font-medium">
                  Close
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest">
                  Slider Image
                </label>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-light">
                  RECOMMENDED: 1920 x 800 PIXELS (3:1 RATIO)
                </p>
                <div className="w-full bg-gray-50 border border-gray-100 p-8 text-center flex justify-center">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest">
                    Position
                  </label>
                  <select
                    value={formData.position || "top"}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 font-light appearance-none text-gray-900"
                  >
                    <option value="top">Top (Main Hero)</option>
                    <option value="after_row_1">After 1st Category Row</option>
                    <option value="after_row_2">After 2nd Category Row</option>
                    <option value="after_row_3">After 3rd Category Row</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors p-4 rounded-lg">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="peer w-5 h-5 opacity-0 absolute z-10 cursor-pointer"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white peer-checked:bg-black peer-checked:border-black transition-colors flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-white hidden peer-checked:block pointer-events-none"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M3 8L6 11L11 3.5"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            stroke="currentColor"
                          ></path>
                        </svg>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest group-hover:text-black">
                      Active Status
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="E.g., Summer Collection 2026"
                  className="w-full bg-transparent border-0 border-b border-gray-200 py-3 text-sm focus:ring-0 focus:border-black transition-colors px-0 placeholder:text-gray-300 font-light"
                />
              </div>

              <div className="pt-8 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center items-center gap-2 px-6 py-4 bg-black text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Processing..."
                    : editingSlider
                      ? "Update Slider"
                      : "Create Slider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
