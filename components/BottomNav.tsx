"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FiHome, FiShoppingCart, FiUser } from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";

export default function BottomNav() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const isAdminPage = pathname?.startsWith("/admin");
  const isSearchPage = pathname?.startsWith("/search");
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isAuthPage || isAdminPage || isSearchPage) return null;

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-9998 md:hidden">
        <div className="flex justify-around items-center h-16">
          {/* Home */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-1/4 h-full hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FiHome size={24} className="text-black" />
            <span className="text-xs text-gray-600 mt-1">Home</span>
          </Link>

          {/* Products */}
          <Link
            href="/products"
            className="relative flex flex-col items-center justify-center w-1/4 h-full hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FiShoppingCart size={24} className="text-black" />
            {totalItems > 0 && (
              <span
                className="absolute top-1.5 right-4 text-white text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-semibold leading-none"
                style={{ backgroundColor: "var(--badge-color, #dc2626)" }}
              >
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
            <span className="text-xs text-gray-600 mt-1">Shop</span>
          </Link>

          {/* Cart */}
          <button
            onClick={() => useCartStore.getState().openCart()}
            className="relative flex flex-col items-center justify-center w-1/4 h-full hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent"
          >
            <FiShoppingCart size={24} className="text-black" />
            {totalItems > 0 && (
              <span
                className="absolute top-1.5 right-4 text-white text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-semibold leading-none"
                style={{
                  backgroundColor: "var(--bottom-badge-color, #dc2626)",
                }}
              >
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
            <span className="text-xs text-gray-600 mt-1">Cart</span>
          </button>

          {/* Profile (replaces menu) */}
          <Link
            href={session ? "/profile" : "/auth/signin"}
            className="flex flex-col items-center justify-center w-1/4 h-full hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FiUser size={24} className="text-black" />
            <span className="text-xs text-gray-600 mt-1">
              {session ? "Profile" : "Sign In"}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
