"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { io as ClientIO } from "socket.io-client";
import { hasPermission, canAccessAdminPanel } from "@/lib/rolePermissions";

// icons
import { MdMenuOpen } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import {
  FiGrid,
  FiImage,
  FiShoppingBag,
  FiList,
  FiPackage,
  FiHome,
  FiMessageCircle,
  FiUsers,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

interface MenuItem {
  icons: React.ReactNode;
  label: string;
  href: string;
  requiredPermission?: string;
}

const menuItems: MenuItem[] = [
  {
    icons: <FiGrid size={26} />,
    label: "Dashboard",
    href: "/admin",
  },
  {
    icons: <FiUsers size={26} />,
    label: "Active Logins",
    href: "/admin/active-sessions",
    requiredPermission: "manage_users",
  },
  {
    icons: <FiUsers size={26} />,
    label: "Staff",
    href: "/admin/staff",
    requiredPermission: "manage_users",
  },
  {
    icons: <FiImage size={26} />,
    label: "Sliders",
    href: "/admin/sliders",
    requiredPermission: "manage_sliders",
  },
  {
    icons: <FiShoppingBag size={26} />,
    label: "Products",
    href: "/admin/products",
    requiredPermission: "manage_products",
  },
  {
    icons: <FiList size={26} />,
    label: "Categories",
    href: "/admin/categories",
    requiredPermission: "manage_categories",
  },
  {
    icons: <FiMessageCircle size={26} />,
    label: "Chats",
    href: "/admin/chat",
  },
  {
    icons: <FiPackage size={26} />,
    label: "Orders",
    href: "/admin/orders",
    requiredPermission: "manage_orders",
  },
  {
    icons: <FiMessageCircle size={26} />,
    label: "Reviews",
    href: "/admin/reviews",
    requiredPermission: "manage_products",
  },
  {
    icons: <FiHome size={26} />,
    label: "Storefront",
    href: "/",
  },
];

// insert banner admin menu
menuItems.splice(menuItems.length - 1, 0, {
  icons: <FiImage size={26} />,
  label: "Top Banner",
  href: "/admin/banner",
  requiredPermission: "manage_banners",
});
// insert popup admin menu
menuItems.splice(menuItems.length - 1, 0, {
  icons: <FiImage size={26} />,
  label: "Site Popup",
  href: "/admin/popup",
  requiredPermission: "manage_settings",
});
// insert footer admin menu
menuItems.splice(menuItems.length - 1, 0, {
  icons: <FiList size={26} />,
  label: "Footer",
  href: "/admin/footer",
  requiredPermission: "manage_settings",
});

// insert site settings admin menu
menuItems.splice(menuItems.length - 1, 0, {
  icons: <FiSettings size={26} />,
  label: "Site Settings",
  href: "/admin/site",
  requiredPermission: "manage_settings",
});

// insert theme colors admin menu
menuItems.splice(menuItems.length - 1, 0, {
  icons: <FiImage size={26} />,
  label: "Theme Colors",
  href: "/admin/theme",
  requiredPermission: "manage_settings",
});

// insert popup admin menu
menuItems.splice(menuItems.length - 1, 0, {
  icons: <FiList size={26} />,
  label: "FAQ Accordion",
  href: "/admin/faq",
  requiredPermission: "manage_faq",
});

export default function Sidebar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const pathnameRef = React.useRef(pathname);

  const user = session?.user;
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "A";
  const userImage = (user as any)?.image;

  // Function to handle automatic close on mobile when clicking links
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    pathnameRef.current = pathname;
    // Clear unread when entering chat page
    if (pathname === "/admin/chat") {
      setUnreadCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    let socketInstance: any;
    let isMounted = true;

    // Only connect socket logic if admin or staff
    if (!canAccessAdminPanel(session?.user?.role as any)) return;

    const initSocket = async () => {
      try {
        await fetch("/api/socket/io");
        if (!isMounted) return;

        socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || "", {
          path: "/api/socket/io",
          addTrailingSlash: false,
        });

        socketInstance.on("connect", () => {
          socketInstance.emit("join-admin");
        });

        socketInstance.on("admin-new-message", (msg: any) => {
          // If not already on chat page and sender is not admin, increment
          if (
            pathnameRef.current !== "/admin/chat" &&
            msg?.senderModel !== "Admin"
          ) {
            setUnreadCount((c) => c + 1);
          }
        });
      } catch (err) {
        console.error(err);
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socketInstance) socketInstance.disconnect();
    };
  }, [session]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden rounded-2xl flex items-center justify-between bg-gray-900 text-white p-4 fixed top-0 w-full z-50 h-16 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/homyorganic.png"
            alt="Logo"
            className="w-8 h-8 rounded-full bg-white p-0.5"
          />
          <span className="font-bold tracking-wider text-sm">Homy Organic</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-300 hover:text-white focus:outline-none relative"
        >
          {isMobileMenuOpen ? (
            <MdMenuOpen size={28} />
          ) : (
            <MdMenuOpen size={28} className="rotate-180" />
          )}
          {unreadCount > 0 && !isMobileMenuOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-gray-900"></span>
          )}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav
        className={`shadow-2xl md:shadow-none h-[100dvh] flex flex-col duration-300 bg-yellow-200 text-white fixed md:relative z-50 md:z-auto top-0 left-0
          ${isMobileMenuOpen ? "translate-x-0 w-64 md:w-64 pt-4 md:pt-0" : "-translate-x-full w-64 md:translate-x-0 md:w-16"}
          ${open && "md:w-60"}
        `}
      >
        {/* Header */}
        <div className="px-3 py-2 h-20 flex justify-between items-center hidden md:flex">
          <Link href="/">
            <img
              src="/homyorganic.png"
              alt="Logo"
              className={`${open ? "w-20" : "w-0"} rounded-md`}
            />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            title="Toggle Sidebar"
            className="focus:outline-none"
          >
            <MdMenuOpen
              size={34}
              className={`duration-300 cursor-pointer ${!open && "rotate-180"}`}
            />
          </button>
        </div>

        {/* Body */}
        <ul className="flex-1 overflow-y-auto overflow-x-hidden mt-16 md:mt-0 px-2 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems
            .filter((item) => {
              // Always show dashboard and storefront
              if (!item.requiredPermission || item.label === "Dashboard" || item.label === "Storefront") {
                return true;
              }
              // Filter based on user's permissions
              return hasPermission(user?.role, item.requiredPermission);
            })
            .map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                href={item.href}
                key={index}
                className="block relative"
                onClick={handleLinkClick}
              >
                <li
                  className={`px-3 py-3 md:py-2 mx-1 my-1.5 md:my-2 rounded-xl duration-200 cursor-pointer flex gap-4 items-center relative group
                  ${isActive ? "bg-gray-800 text-white" : "hover:bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  <div className="relative shrink-0 text-white md:text-inherit group-hover:text-white transition-colors">
                    {item.icons}
                    {item.label === "Chats" && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce border border-gray-900">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p
                    className={`${!open && !isMobileMenuOpen ? "w-0 opacity-0 hidden md:block" : "w-auto opacity-100"} duration-300 overflow-hidden whitespace-nowrap font-medium text-sm md:text-base`}
                  >
                    {item.label}
                    {item.label === "Chats" &&
                      unreadCount > 0 &&
                      (open || isMobileMenuOpen) && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wide">
                          {unreadCount} NEW
                        </span>
                      )}
                  </p>
                </li>
              </Link>
            );
          })}
        </ul>

        {/* Footer info/Profile Link */}
        <div className="border-t border-gray-800 mt-auto">
          <Link
            href="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 md:px-3 py-4 md:py-3 mb-2 mx-2 md:mx-0 cursor-pointer hover:bg-gray-800 rounded-xl transition-all group"
          >
            <div className="shrink-0 relative">
              {userImage ? (
                <img
                  src={userImage}
                  alt={(user as any)?.name || "Admin"}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-gray-700">
                  {firstLetter}
                </div>
              )}
            </div>
            <div
              className={`leading-5 ${!open && !isMobileMenuOpen ? "w-0 opacity-0 hidden md:block" : "w-auto opacity-100"} duration-300 overflow-hidden whitespace-nowrap`}
            >
              <p className="font-semibold text-sm text-white">
                {user?.name || "Admin"}
              </p>
              <span className="text-xs text-gray-400">
                {user?.email || "admin@example.com"}
              </span>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 md:px-3 py-3 md:py-2.5 mb-2 mx-2 md:mx-0 cursor-pointer hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-xl transition-all group"
            title="Sign out from admin panel"
          >
            <FiLogOut size={20} className="shrink-0" />
            <span
              className={`text-sm font-medium ${!open && !isMobileMenuOpen ? "w-0 opacity-0 hidden md:block" : "w-auto opacity-100"} duration-300 overflow-hidden whitespace-nowrap`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
