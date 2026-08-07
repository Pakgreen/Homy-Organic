"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiEdit, FiTrash2, FiPlus, FiX, FiUserCheck, FiShield } from "react-icons/fi";
import { roleDescriptions } from "@/lib/rolePermissions";
import AdminDeleteModal from "@/components/AdminDeleteModal";

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
  const [deletingStaff, setDeletingStaff] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deletingStaff) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/admin/staff/${deletingStaff._id}`);
      toast.success("Staff member deleted successfully");
      setDeletingStaff(null);
      fetchStaffUsers();
    } catch (error) {
      toast.error("Failed to delete staff member");
    } finally {
      setIsDeleting(false);
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

  const roleColors: Record<UserRole, { bg: string; border: string; text: string }> = {
    admin: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    manager: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    moderator: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
    support: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Staff Management</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage admin, managers, moderators, and support team</p>
          </div>
          {staffUsers.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: "#B9853A" }}>
              {staffUsers.length}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer w-fit"
          style={{ backgroundColor: "#B9853A" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#a07230")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B9853A")}
        >
          <FiPlus size={15} strokeWidth={2.5} />
          Add Staff
        </button>
      </div>

      {/* Empty State */}
      {staffUsers.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF6EC] flex items-center justify-center mb-4">
            <FiUserCheck size={24} style={{ color: "#B9853A" }} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No staff members yet</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            Add team members and assign specific management roles.
          </p>
          <button
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: "#B9853A" }}
          >
            Add Staff
          </button>
        </div>
      )}

      {/* Staff Grid */}
      {staffUsers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffUsers.map((user) => {
            const roleStyle = roleColors[user.role] || {
              bg: "bg-gray-50",
              border: "border-gray-200",
              text: "text-gray-700",
            };
            const initials = user.name?.slice(0, 2).toUpperCase() || "ST";

            return (
              <div
                key={user._id}
                className="group bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 bg-[#FDF6EC]"
                      style={{ color: "#B9853A" }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">
                        {user.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`shrink-0 text-[10px] uppercase tracking-wider font-bold border px-2.5 py-0.5 rounded-full ${roleStyle.bg} ${roleStyle.border} ${roleStyle.text}`}
                  >
                    {user.role}
                  </span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {roleDescriptions[user.role]}
                </p>

                <div className="h-px bg-gray-50" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 rounded-lg transition-all cursor-pointer"
                  >
                    <FiEdit size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingStaff(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  >
                    <FiTrash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modern Staff Modal Popup ── */}
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
              setEditingUser(null);
              resetForm();
            }}
          />

          {/* Modal Card */}
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90dvh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "#B9853A" }}>
                  {editingUser ? "Edit" : "New"}
                </p>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingUser ? "Edit Staff Member" : "Add Staff Member"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg font-light cursor-pointer"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="px-5 py-5 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ali Khan"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ali@example.com"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  />
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Role & Permissions <span className="text-red-400">*</span>
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all text-gray-900"
                  >
                    <option value="moderator">Moderator</option>
                    <option value="manager">Manager</option>
                    <option value="support">Support Staff</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* Role description info box */}
                  <div className="mt-2.5 p-3 rounded-lg bg-[#FDF6EC] border border-[#F5E6CE] flex items-start gap-2.5">
                    <FiShield size={16} className="shrink-0 mt-0.5" style={{ color: "#B9853A" }} />
                    <p className="text-xs text-gray-700 leading-relaxed font-normal">
                      {roleDescriptions[formData.role]}
                    </p>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    {editingUser ? "New Password (optional)" : "Password"} {!editingUser && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Leave blank to keep current" : "At least 8 characters"}
                    minLength={8}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  />
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
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B9853A")}
                >
                  {isLoading ? "Saving..." : editingUser ? "Update Staff" : "Create Staff"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
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

      <AdminDeleteModal
        isOpen={!!deletingStaff}
        title="Delete Staff Member?"
        description="Are you sure you want to delete this staff account? They will lose administrative access."
        itemName={deletingStaff?.name ? `${deletingStaff.name} (${deletingStaff.email})` : "Staff Account"}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteStaff}
        onClose={() => setDeletingStaff(null)}
      />
    </div>
  );
}
