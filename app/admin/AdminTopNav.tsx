"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { FiLogOut } from "react-icons/fi";

export default function AdminTopNav() {
  const { data: session } = useSession();
  const user = session?.user;
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "A";
  const userImage = (user as any)?.image;

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 w-full shadow-sm">
      {/* Left: Static Title */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-gray-900">
          Admin Workspace
        </h1>
        <p className="text-xs text-gray-500">Manage your e-commerce store</p>
      </div>

      {/* Right: User + Logout */}
      <div className="flex items-center gap-3">
        {/* User Profile Link */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all group"
        >
          <div className="shrink-0">
            {userImage ? (
              <img
                src={userImage}
                alt={user?.name || "Admin"}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                {firstLetter}
              </div>
            )}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-black">
              {user?.name || "Admin"}
            </p>
            <span className="text-xs text-gray-400">
              {(user as any)?.role || "Administrator"}
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Sign out"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium cursor-pointer"
        >
          <FiLogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
