"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiHelpCircle,
} from "react-icons/fi";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [avatar, setAvatar] = useState("");
  const [initialForm, setInitialForm] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  useEffect(() => {
    // Profile page is now guest-accessible
    // Users can view/edit profile even without login
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsFetching(true);
    try {
      const res = await axios.get("/api/user/profile");
      const user = res.data;
      setAvatar(user.avatar || "");
      const data = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
      };

      setFormData(data);
      setInitialForm(data);
      setIsDirty(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = uploadRes.data.url;
      setAvatar(imageUrl);

      // Update profile with new avatar
      await axios.put("/api/user/profile", { avatar: imageUrl });
      await update();
      setIsDirty(false);
      toast.success("Profile picture updated!");
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return toast("No changes to save");
    setIsLoading(true);

    try {
      // Send only changed fields to reduce payload
      const payload: any = {};
      if (initialForm) {
        if (formData.name !== initialForm.name) payload.name = formData.name;
        if (formData.phone !== initialForm.phone)
          payload.phone = formData.phone;
        if (
          JSON.stringify(formData.address) !==
          JSON.stringify(initialForm.address)
        )
          payload.address = formData.address;
      } else {
        Object.assign(payload, formData);
      }

      if (Object.keys(payload).length === 0) {
        toast("No changes to save");
        setIsLoading(false);
        return;
      }

      await axios.put("/api/user/profile", payload);
      toast.success("Profile updated successfully!");
      setInitialForm(formData);
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const markDirty = useCallback(
    (nextForm: any) => {
      if (!initialForm) {
        setIsDirty(true);
        return;
      }
      setIsDirty(JSON.stringify(nextForm) !== JSON.stringify(initialForm));
    },
    [initialForm],
  );

  const handleChange = useCallback(
    (key: string, value: any) => {
      const next = { ...formData, [key]: value };
      setFormData(next);
      markDirty(next);
    },
    [formData, markDirty],
  );

  const handleAddressChange = useCallback(
    (field: string, value: any) => {
      const next = {
        ...formData,
        address: { ...formData.address, [field]: value },
      };
      setFormData(next);
      markDirty(next);
    },
    [formData, markDirty],
  );

  if (status === "loading" || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Info Card */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="text-center">
            <div className="relative w-28 h-28 rounded-full mx-auto mb-4 group">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={formData.name}
                  fill
                  className="object-cover rounded-full"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <FiUser size={48} className="text-gray-300" />
                </div>
              )}

              {/* Upload Button Badge */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center cursor-pointer shadow-sm"
              >
                <FiCamera size={14} className="text-gray-600" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-lg text-gray-900">
              {formData.name}
            </h3>
            <p className="text-gray-500 text-sm inline-flex items-center justify-center gap-2">
              {formData.email}
              <FiHelpCircle className="text-gray-400" size={14} aria-hidden />
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Role:{" "}
              <span className="font-medium text-gray-700">
                {session?.user.role}
              </span>
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-gray-900">
            Edit Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <FiUser /> Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <FiMail /> Email
              </label>
              <input
                type="email"
                value={formData.email}
                className="w-full border border-gray-100 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <FiPhone /> Phone Number
                <FiHelpCircle className="text-gray-400" size={14} aria-hidden />
              </label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FiMapPin /> Address Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address?.street || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          street: e.target.value,
                        },
                      })
                    }
                    className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.address?.city || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.address?.state || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            state: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Zip Code</label>
                    <input
                      type="text"
                      value={formData.address?.zipCode || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            zipCode: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.address?.country || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            country: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-700 cursor-pointer text-white rounded-md py-2 font-semibold mt-6 hover:bg-black disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
