"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function FooterSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    brandName: "",
    tagline: "",
    contact: {
      email: "",
      phone: "",
      address: "",
    },
    socials: {
      facebook: "",
      twitter: "",
      instagram: "",
    },
    links: [{ label: "Shop", url: "/products" }],
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings/footer");
        setFormData({
          ...data,
          links: data.links || [{ label: "Shop", url: "/products" }],
        });
      } catch (error) {
        toast.error("Failed to load footer settings");
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLinkChange = (index: number, field: string, value: string) => {
    const newLinks = [...(formData.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links || []), { label: "", url: "" }],
    }));
  };

  const removeLink = (index: number) => {
    const newLinks = [...(formData.links || [])];
    newLinks.splice(index, 1);
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put("/api/settings/footer", formData);
      toast.success("Footer settings updated successfully");
    } catch (error) {
      toast.error("Failed to update footer settings");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-sm text-gray-500 font-light">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">
          Footer Settings
        </h1>
        <p className="text-sm text-gray-400 mt-2 font-light">
          Manage footer links and branding
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-sm uppercase tracking-widest text-gray-400 font-semibold mb-6">
              Branding
            </h2>

            <div className="border-b border-gray-100 pb-6">
              <label className="block text-xs font-medium text-gray-900 uppercase tracking-widest mb-4">
                Brand Name
              </label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                className="w-full px-0 py-2 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light text-gray-900"
                required
              />
            </div>

            <div className="border-b border-gray-100 pb-6">
              <label className="block text-xs font-medium text-gray-900 uppercase tracking-widest mb-4">
                Tagline
              </label>
              <textarea
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                rows={3}
                className="w-full px-0 py-2 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light text-gray-900 resize-none"
                required
              />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm uppercase tracking-widest text-gray-400 font-semibold mb-6">
              Contact Info
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="contact.email"
                value={formData.contact.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                name="contact.address"
                value={formData.contact.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Explore Links</h2>
            <button
              type="button"
              onClick={addLink}
              className="text-sm bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200"
            >
              + Add Link
            </button>
          </div>

          <div className="space-y-3">
            {(formData.links || []).map((link, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Label (e.g. Shop)"
                    value={link.label}
                    onChange={(e) =>
                      handleLinkChange(index, "label", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="URL (e.g. /products)"
                    value={link.url}
                    onChange={(e) =>
                      handleLinkChange(index, "url", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-semibold">Social Links</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                name="socials.facebook"
                value={formData.socials.facebook}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Twitter URL
              </label>
              <input
                type="url"
                name="socials.twitter"
                value={formData.socials.twitter}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                name="socials.instagram"
                value={formData.socials.instagram}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="px-6 cursor-pointer py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors uppercase tracking-widest"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
