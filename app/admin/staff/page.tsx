"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import { roleDescriptions } from "@/lib/rolePermissions";

type UserRole = "admin" | "moderator" | "manager" | "support";

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function AdminStaffPage() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "moderator" as UserRole,
  });

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  const fetchStaffUsers = async () => {
    try {
      const res = await axios.get("/api/admin/staff");
      setStaffUsers(res.data.staff || []);
    } catch (error) {
      toast.error("Failed to fetch staff members");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("Password is required for new staff members");
      return;
    }

    setIsLoading(true);
    try {
      if (editingUser) {
        await axios.put(`/api/admin/staff/${editingUser._id}`, formData);
        toast.success("Staff member updated successfully");
      } else {
        await axios.post("/api/admin/staff", formData);
        toast.success("Staff member created successfully");
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchStaffUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save staff member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await axios.delete(`/api/admin/staff/${id}`);
      toast.success("Staff member deleted successfully");
      fetchStaffUsers();
    } catch (error) {
      toast.error("Failed to delete staff member");
    }
  };

  const handleEdit = (user: StaffUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "moderator",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6 w-full">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Staff Management
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-light">
            Manage admin, moderators, managers, and support staff
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          className="text-xs uppercase tracking-widest font-medium text-gray-900 hover:text-gray-500 border-b border-transparent hover:border-gray-500 transition-colors cursor-pointer pb-0.5 flex items-center gap-2"
        >
          <FiPlus strokeWidth={1.5} size={14} /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffUsers.map((user) => (
          <div
            key={user._id}
            className="group relative bg-white border border-gray-200 p-6 flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-light text-lg text-gray-900 tracking-tight truncate">
                  {user.name}
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold border border-blue-200 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-light truncate">
                {user.email}
              </p>
              <p className="text-[11px] text-gray-500 font-light line-clamp-2">
                {roleDescriptions[user.role]}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
              <button
                onClick={() => handleEdit(user)}
                className="text-[10px] uppercase tracking-widest cursor-pointer font-semibold text-gray-400 hover:text-black transition-colors flex items-center gap-1.5"
              >
                <FiEdit size={12} /> Edit
              </button>
              <button
                onClick={() => handleDelete(user._id)}
                className="text-[10px] uppercase tracking-widest cursor-pointer font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
              >
                <FiTrash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-100 font-semibold mx-auto">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                  Staff Management
                </div>
                <h3 className="text-xl font-extrabold">
                  {editingUser ? "Edit Staff Member" : "Add New Staff Member"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-gray-900 font-extrabold">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-gray-900 font-extrabold">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-gray-900 font-extrabold">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="input"
                >
                  <option value="moderator">Moderator</option>
                  <option value="manager">Manager</option>
                  <option value="support">Support Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  {roleDescriptions[formData.role]}
                </p>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="block text-gray-900 font-extrabold">
                    Password *
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="input"
                    placeholder="At least 8 characters"
                    minLength={8}
                  />
                </div>
              )}

              {editingUser && (
                <div className="space-y-2">
                  <label className="block text-gray-900 font-extrabold">
                    Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="input"
                    placeholder="Leave blank to keep current password"
                    minLength={8}
                  />
                </div>
              )}

              <div className="flex gap-4 pt-8 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
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
