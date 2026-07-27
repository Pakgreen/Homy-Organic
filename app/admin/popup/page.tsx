"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import LocalImageUpload from "@/components/LocalImageUpload";

export default function PopupSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    enabled: false,
    image: "",
    link: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings/popup");
        setFormData({
          enabled: data?.enabled || false,
          image: data?.image || "",
          link: data?.link || "",
        });
      } catch (error) {
        toast.error("Failed to load popup settings");
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      image: url,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put("/api/settings/popup", formData);
      toast.success("Popup settings saved successfully");
    } catch (error) {
      toast.error("Failed to save popup settings");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">
        Site Popup
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.enabled}
              onChange={(e) =>
                setFormData({ ...formData, enabled: e.target.checked })
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
          <span className="text-sm font-semibold text-gray-800">
            Show Popup on Homepage
          </span>
        </div>

        {/* Image Upload */}
        <div className="bg-gray-50 border border-gray-100 p-4 rounded">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Upload Image
          </label>
          <LocalImageUpload
            value={formData.image}
            onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
            onRemove={() => setFormData((prev) => ({ ...prev, image: "" }))}
            className="w-full h-48 max-w-sm"
          />
        </div>

        {/* Optional Link */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Redirection Link (Optional)
          </label>
          <input
            type="text"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none transition-all text-sm"
            placeholder="e.g., /products?category=sale"
          />
          <p className="text-xs text-gray-500 mt-1">
            If provided, clicking the image will take visitors here.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto py-2.5 px-6 cursor-pointer bg-black hover:bg-gray-800 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
