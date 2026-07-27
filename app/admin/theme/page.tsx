"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiSave, FiRefreshCw } from "react-icons/fi";

const defaultTheme = {
  primaryColor: "#000000",
  headingColor: "#000000",
  textColor: "#374151",
  buttonBgColor: "#000000",
  buttonTextColor: "#ffffff",
  backgroundColor: "#ffffff",
  footerBgColor: "#ffffff",
  footerTextColor: "#374151",
  navbarBgColor: "#ffffff",
  navbarTextColor: "#111827",
};

const darkThemePreset = {
  primaryColor: "#eab308", // Golden/Yellow accent
  headingColor: "#ffffff",
  textColor: "#d1d5db", // gray-300
  buttonBgColor: "#ffffff",
  buttonTextColor: "#000000",
  backgroundColor: "#000000",
  footerBgColor: "#111827", // gray-900
  footerTextColor: "#9ca3af", // gray-400
  navbarBgColor: "#111827",
  navbarTextColor: "#f3f4f6",
};

const earthyPreset = {
  primaryColor: "#8b5cf6", // Purple
  headingColor: "#4c1d95", // Deep purple
  textColor: "#4b5563",
  buttonBgColor: "#4c1d95",
  buttonTextColor: "#ffffff",
  backgroundColor: "#faf5ff", // Light purple bg
  footerBgColor: "#1e1b4b", // Extra deep purple for footer
  footerTextColor: "#e5e7eb",
  navbarBgColor: "#ffffff",
  navbarTextColor: "#4c1d95",
};

export default function ThemeSettingsPage() {
  const [formData, setFormData] = useState(defaultTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/settings/theme");
      if (res.data) setFormData({ ...defaultTheme, ...res.data });
    } catch (error) {
      console.error("Failed to fetch theme settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.post("/api/settings/theme", formData);
      toast.success("Theme settings updated successfully");
      // Optionally trigger reload to see changes on admin side
      window.location.reload();
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Failed to save theme settings");
    } finally {
      setIsSaving(false);
    }
  };

  const applyThemePreset = (preset: typeof defaultTheme) => {
    setFormData(preset);
  };

  const resetToDefault = () => {
    setFormData(defaultTheme);
  };

  if (isLoading)
    return (
      <div className="p-8 text-black font-medium">Loading Theme Colors...</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-6 px-4 pt-4 sm:px-0 sm:pt-0 gap-4 sm:gap-0">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Theme & Colors
        </h1>
        <div className="flex items-center justify-end gap-3 flex-wrap">
          {/* Preset Buttons */}
          <div className="flex bg-gray-100 p-1 rounded-md text-xs font-semibold mr-1">
            <button
              onClick={() => applyThemePreset(defaultTheme)}
              className="px-3 py-1.5 rounded bg-white shadow-sm border border-gray-200 text-black hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Light
            </button>
            <button
              onClick={() => applyThemePreset(darkThemePreset)}
              className="px-3 py-1.5 rounded text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              Dark
            </button>
            <button
              onClick={() => applyThemePreset(earthyPreset)}
              className="px-3 py-1.5 rounded text-gray-500 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Purple
            </button>
          </div>

          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            <FiRefreshCw size={16} />
            Reset( Default )
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer"
          >
            <FiSave size={16} />
            {isSaving ? "Saving..." : "Save Colors"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 space-y-8">
        <p className="text-sm text-gray-500 mb-6 border-l-4 border-orange-500 pl-3 bg-orange-50 py-2">
          <strong>Note:</strong> Changes here affect the overall storefront
          layout. Refresh the store page to see updates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Primary Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Used for links, active icons, essential highlights.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Headings (H1-H6) Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.headingColor}
                onChange={(e) =>
                  setFormData({ ...formData, headingColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.headingColor}
                onChange={(e) =>
                  setFormData({ ...formData, headingColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Color applied to primary block headers (H1, H2, etc).
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Base Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) =>
                  setFormData({ ...formData, textColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.textColor}
                onChange={(e) =>
                  setFormData({ ...formData, textColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Main paragraph and standard text color.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Button Background
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.buttonBgColor}
                onChange={(e) =>
                  setFormData({ ...formData, buttonBgColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.buttonBgColor}
                onChange={(e) =>
                  setFormData({ ...formData, buttonBgColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              For major action buttons (Add to cart, checkout, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Button Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.buttonTextColor}
                onChange={(e) =>
                  setFormData({ ...formData, buttonTextColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.buttonTextColor}
                onChange={(e) =>
                  setFormData({ ...formData, buttonTextColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Text inside the main buttons.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Main Background
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.backgroundColor}
                onChange={(e) =>
                  setFormData({ ...formData, backgroundColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.backgroundColor}
                onChange={(e) =>
                  setFormData({ ...formData, backgroundColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Color behind the whole site.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Footer Background
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.footerBgColor}
                onChange={(e) =>
                  setFormData({ ...formData, footerBgColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.footerBgColor}
                onChange={(e) =>
                  setFormData({ ...formData, footerBgColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Background color for the entire footer section.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Footer Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.footerTextColor}
                onChange={(e) =>
                  setFormData({ ...formData, footerTextColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.footerTextColor}
                onChange={(e) =>
                  setFormData({ ...formData, footerTextColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Text, icons, and links color inside the footer.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Navbar Background
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.navbarBgColor || "#ffffff"}
                onChange={(e) =>
                  setFormData({ ...formData, navbarBgColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.navbarBgColor || "#ffffff"}
                onChange={(e) =>
                  setFormData({ ...formData, navbarBgColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Background color for the top navigation bar.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
              Navbar Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.navbarTextColor || "#111827"}
                onChange={(e) =>
                  setFormData({ ...formData, navbarTextColor: e.target.value })
                }
                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.navbarTextColor || "#111827"}
                onChange={(e) =>
                  setFormData({ ...formData, navbarTextColor: e.target.value })
                }
                className="border border-gray-300 w-full rounded p-2 text-sm uppercase font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">
              Text, icons, and links color inside the navbar.
            </p>
          </div>
        </div>

        {/* Live Preview Sample */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-lg font-bold mb-4">Preview</h3>
          <div
            className="p-6 border rounded-lg shadow-sm w-full"
            style={{ backgroundColor: formData.backgroundColor }}
          >
            <h2
              style={{ color: formData.headingColor }}
              className="text-2xl font-bold mb-2"
            >
              Beautiful Heading H2 Sample
            </h2>
            <p
              style={{ color: formData.textColor }}
              className="mb-6 leading-relaxed"
            >
              This is standard paragraph text. It shows how the body text pairs
              with the{" "}
              <span
                style={{ color: formData.primaryColor }}
                className="underline font-medium cursor-pointer"
              >
                primary brand highlighted link
              </span>
              . By picking colors carefully, you control the minimal and classy
              contrast.
            </p>
            <button
              className="px-6 py-2.5 font-bold uppercase tracking-wider text-xs rounded-sm transition-opacity hover:opacity-80"
              style={{
                backgroundColor: formData.buttonBgColor,
                color: formData.buttonTextColor,
              }}
            >
              Primary Button Action
            </button>
          </div>

          <div
            className="mt-6 p-6 rounded-lg w-full flex flex-col sm:flex-row justify-between items-center bg-gray-50 border border-gray-200"
            style={{
              backgroundColor: formData.footerBgColor,
              color: formData.footerTextColor,
              borderColor:
                formData.footerBgColor === "#ffffff"
                  ? "#e5e7eb"
                  : formData.footerBgColor,
            }}
          >
            <div
              style={{ color: formData.footerTextColor }}
              className="font-bold text-lg"
            >
              Footer Branding
            </div>
            <div className="text-sm opacity-80 mt-2 sm:mt-0">
              © 2026 Copyright sample
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
