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
  FiGift,
  FiAward,
} from "react-icons/fi";

interface MenuItem {
  icons: React.ReactNode;
  label: string;
  href: string;
  requiredPermission?: string;
}

const menuItems: MenuItem[] = [
  // ── Core
  {
    icons: <FiGrid size={22} />,
    label: "Dashboard",
    href: "/admin",
  },
  {
    icons: <FiList size={22} />,
    label: "Categories",
    href: "/admin/categories",
    requiredPermission: "manage_categories",
  },
  {
    icons: <FiShoppingBag size={22} />,
    label: "Products",
    href: "/admin/products",
    requiredPermission: "manage_products",
  },
  {
    icons: <FiGift size={22} />,
    label: "Value Packs",
    href: "/admin/value-packs",
    requiredPermission: "manage_products",
  },
  {
    icons: <FiAward size={22} />,
    label: "Best Sellers",
    href: "/admin/best-sellers",
    requiredPermission: "manage_products",
  },
  {
    icons: <FiPackage size={22} />,
    label: "Orders",
    href: "/admin/orders",
    requiredPermission: "manage_orders",
  },
  {
    icons: <FiMessageCircle size={22} />,
    label: "Reviews",
    href: "/admin/reviews",
    requiredPermission: "manage_products",
  },
  {
    icons: <FiMessageCircle size={22} />,
    label: "Chats",
    href: "/admin/chat",
  },
  // ── Media / Content
  {
    icons: <FiImage size={22} />,
    label: "Sliders",
    href: "/admin/sliders",
    requiredPermission: "manage_sliders",
  },
  {
    icons: <FiImage size={22} />,
    label: "Top Banner",
    href: "/admin/banner",
    requiredPermission: "manage_banners",
  },
  {
    icons: <FiImage size={22} />,
    label: "Site Popup",
    href: "/admin/popup",
    requiredPermission: "manage_settings",
  },
  // ── Users
  {
    icons: <FiUsers size={22} />,
    label: "Staff",
    href: "/admin/staff",
    requiredPermission: "manage_users",
  },
  {
    icons: <FiUsers size={22} />,
    label: "Active Logins",
    href: "/admin/active-sessions",
    requiredPermission: "manage_users",
  },
  // ── Settings
  {
    icons: <FiSettings size={22} />,
    label: "Site Settings",
    href: "/admin/site",
    requiredPermission: "manage_settings",
  },
  {
    icons: <FiSettings size={22} />,
    label: "Theme Colors",
    href: "/admin/theme",
    requiredPermission: "manage_settings",
  },
  {
    icons: <FiList size={22} />,
    label: "Footer",
    href: "/admin/footer",
    requiredPermission: "manage_settings",
  },
  {
    icons: <FiList size={22} />,
    label: "FAQ Accordion",
    href: "/admin/faq",
    requiredPermission: "manage_faq",
  },
  // ── Storefront
  {
    icons: <FiHome size={22} />,
    label: "Storefront",
    href: "/",
  },
];

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
      {/* Floating Mobile Toggle Button (only when sidebar is closed) */}
      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 text-white p-2 rounded-xl shadow-lg focus:outline-none"
          style={{ backgroundColor: '#B9853A' }}
        >
          <MdMenuOpen size={26} className="rotate-180" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white w-3 h-3 rounded-full border-2 border-[#B9853A]"></span>
          )}
        </button>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav
        className={`shadow-2xl rounded-2xl ml-1 mt-2 mb-2 overflow-hidden md:shadow-none h-[calc(100dvh-1rem)] flex flex-col duration-300 bg-white text-black border border-gray-200 fixed md:relative z-50 md:z-auto top-0 left-0
          ${isMobileMenuOpen ? "translate-x-0 w-64 md:w-64" : "-translate-x-full w-64 md:translate-x-0 md:w-16"}
          ${open && "md:w-60"}
        `}
      >
        {/* Header */}
        <div className="px-3 py-2 h-20 flex justify-between items-center">
          <Link href="/" onClick={handleLinkClick}>
            <img
              src="/homyorganic.png"
              alt="Logo"
              className={`${
                open || isMobileMenuOpen ? "w-20" : "w-0"
              } rounded-md transition-all duration-300`}
            />
          </Link>
          {/* Desktop toggle */}
          <button
            onClick={() => setOpen(!open)}
            title="Toggle Sidebar"
            className="focus:outline-none hidden md:block text-black hover:text-[#B9853A] transition-colors"
          >
            <MdMenuOpen
              size={34}
              className={`duration-300 cursor-pointer ${!open && "rotate-180"}`}
            />
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="focus:outline-none md:hidden text-black"
          >
            <MdMenuOpen size={28} />
          </button>
        </div>

        {/* Body */}
        <ul className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  className={`px-3 py-2.5 md:py-2 mx-1 my-1 md:my-1.5 rounded-xl duration-200 cursor-pointer flex gap-3 items-center relative group transition-all
                  ${isActive
                    ? "text-white"
                    : "text-black hover:text-white"}`}
                  style={isActive ? { backgroundColor: '#B9853A' } : undefined}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#B9853A'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                >
                  <div className="relative shrink-0 transition-colors">
                    {item.icons}
                    {item.label === "Chats" && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce border border-white">
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

        {/* Footer info/Profile Link — Mobile only */}
        <div className="border-t border-gray-200 mt-auto md:hidden">
          <Link
            href="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 py-3 mb-1 mx-2 cursor-pointer rounded-xl transition-all hover:text-white"
            style={{ color: 'black' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#B9853A'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'black'; }}
          >
            <div className="shrink-0 relative">
              {userImage ? (
                <img
                  src={userImage}
                  alt={(user as any)?.name || "Admin"}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border border-gray-200 text-white" style={{ backgroundColor: '#B9853A' }}>
                  {firstLetter}
                </div>
              )}
            </div>
            <div className="leading-5 overflow-hidden whitespace-nowrap">
              <p className="font-semibold text-sm">
                {user?.name || "Admin"}
              </p>
              <span className="text-xs text-gray-500">
                {user?.email || "admin@example.com"}
              </span>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-2.5 mb-2 mx-2 cursor-pointer text-red-500 hover:text-red-600 rounded-xl transition-all"
            title="Sign out from admin panel"
          >
            <FiLogOut size={20} className="shrink-0" />
            <span className="text-sm font-medium overflow-hidden whitespace-nowrap">
              Sign Out
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
