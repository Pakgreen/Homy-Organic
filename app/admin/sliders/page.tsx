"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiMenu } from "react-icons/fi";
import { toast } from "sonner";
import LocalImageUpload from "@/components/LocalImageUpload";
import Image from "next/image";

interface Slider {
  _id: string;
  title: string;
  image: string;
  desktopImage?: string;
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
    desktopImage: "",
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
    if (!formData.image) {
      toast.error("Please upload a Mobile Banner Image!");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        title: formData.title,
        image: formData.image,
        desktopImage: formData.desktopImage || "",
        position: formData.position || "top",
        buttonText: formData.buttonText || "",
        buttonLink: formData.buttonLink || "",
        isActive: formData.isActive,
      };

      if (editingSlider) {
        await axios.put(`/api/sliders/${editingSlider._id}`, payload);
        toast.success("Slider banner updated successfully!");
      } else {
        await axios.post("/api/sliders", payload);
        toast.success("Slider banner created successfully!");
      }
      setShowModal(false);
      setEditingSlider(null);
      resetForm();
      await fetchSliders();
    } catch (error: any) {
      console.error("Slider save error:", error);
      toast.error(error.response?.data?.error || "Failed to save slider banner");
    } finally {
      setIsLoading(false);
    }
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...sliders];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);

    // Re-assign 1-indexed sequence order starting from 1
    const reorderedSliders = updated.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    setSliders(reorderedSliders);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      await Promise.all(
        reorderedSliders.map((s) =>
          axios.put(`/api/sliders/${s._id}`, { order: s.order })
        )
      );
      toast.success("Slider order updated!");
    } catch (error) {
      console.error("Error saving slider order:", error);
      toast.error("Failed to save slider order");
      fetchSliders();
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
      title: slider.title || "",
      image: slider.image || "",
      desktopImage: slider.desktopImage || "",
      position: slider.position || "top",
      buttonText: slider.buttonText || "",
      buttonLink: slider.buttonLink || "",
      isActive: slider.isActive ?? true,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      image: "",
      desktopImage: "",
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
        {sliders.map((slider, idx) => (
          <div
            key={slider._id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            className={`group flex flex-col border-b border-gray-100 pb-6 last:border-0 cursor-grab active:cursor-grabbing p-3 rounded-2xl transition-all ${
              dragOverIndex === idx
                ? "bg-amber-50 border-2 border-[#B9853B]"
                : "hover:bg-gray-50/50"
            }`}
          >
            <div className="relative h-48 w-full bg-gray-50 border border-gray-100 mb-4 overflow-hidden rounded-xl">
              <Image
                src={slider.image}
                alt={slider.title}
                fill
                className="object-cover mix-blend-multiply"
              />
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-gray-200/80 shadow-2xs">
                <FiMenu className="text-gray-400 hover:text-black shrink-0" size={13} title="Drag to reorder" />
                <span className="text-[10px] font-bold text-gray-900">
                  Order #{idx + 1}
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1">
                <span className="text-[9px] font-bold px-2 py-0.5 bg-white  shadow-2xs">
                   Mobile
                </span>
                {slider.desktopImage ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-white   shadow-2xs">
                     Web Banner
                  </span>
                ) : (
                  <span className="text-[9px] font-medium px-2 py-0.5 bg-white ">
                     Auto Mobile
                  </span>
                )}
              </div>
              {!slider.isActive && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-900 border border-gray-900 px-3 py-1 bg-white/90">
                    Inactive
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-[10px] font-semibold text-[#B9853A] uppercase tracking-widest">
                    Hero Banner
                  </p>
                </div>

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

                {/* Mobile Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Mobile Banner Image <span className="text-red-400">*</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Used for mobile screens (e.g. 800 × 800 px or square/vertical)
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

                {/* Desktop & Web Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Desktop & Web Banner Image <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Used for desktop/laptop screens (Recommended: 1920 × 480 px wide landscape)
                  </p>
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-center">
                    <div className="w-full max-w-sm aspect-[3/1]">
                      <LocalImageUpload
                        value={formData.desktopImage}
                        onChange={(url) =>
                          setFormData({ ...formData, desktopImage: url })
                        }
                        onRemove={() => setFormData({ ...formData, desktopImage: "" })}
                      />
                    </div>
                  </div>
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
