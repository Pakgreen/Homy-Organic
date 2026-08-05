"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  FiShoppingBag,
  FiUser,
  FiMenu,
  FiX,
  FiSearch,
  FiChevronDown,
  FiLogOut,
  FiPackage,
} from "react-icons/fi";
import { FaRegArrowAltCircleRight } from "react-icons/fa";

import { MdKeyboardArrowDown } from "react-icons/md";

import NavbarHeadSliderLine from "./NavbarHeadSliderLine";

import { useCartStore } from "@/store/cartStore";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

interface Category {
  _id: string;
  name: string;
  showInNav?: boolean;
}

export default function Navbar() {
  const { data: session } = useSession();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteLogo, setSiteLogo] = useState("/homyorganic.png");
  const [tagline, setTagline] = useState("Where Beauty Meets Wellness");
  const totalItems = useCartStore((state) => state.getTotalItems());
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const isAdminPage = pathname?.startsWith("/admin");
  const isSearchPage = pathname?.startsWith("/search");

  useEffect(() => {
    setIsMounted(true);
    fetchCategories();
    fetchSiteLogo();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.categories)
          ? res.data.categories
          : [];
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchSiteLogo = async () => {
    try {
      const { data } = await axios.get("/api/settings/site");
      if (data) {
        if (data.logo) setSiteLogo(data.logo);
        if (data.tagline) setTagline(data.tagline);
      }
    } catch (error) {
      console.error("Error fetching site logo:", error);
    }
  };

  if (isAdminPage || isSearchPage || isAuthPage) return null;

  const flatCategories = categories
    .filter((c) => c.showInNav !== false)
    .slice(0, 10);

  return (
    <>
      <NavbarHeadSliderLine />
      <nav
        className="sticky top-0 z-9991 w-full bg-white border-b border-gray-100 font-[inherit]"
        style={{
          backgroundColor: "var(--navbar-bg, rgba(255, 255, 255, 0.88))",
          color: "var(--navbar-text, #111827)",
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-22 sm:h-24 py-2">
            {/* Left items */}
            <div className="flex items-center gap-4 shrink-0 z-10">
              <div className="relative hidden md:block group">
                <button className="inline-flex items-center gap-1 text-[15px] font-medium  text-black hover:text-gray-600 transition-colors cursor-pointer">
                  Categories
                  <FiChevronDown size={16} />
                </button>

                <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50 min-w-56">
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-2xl p-2">
                    <Link
                      href="/products"
                      className="block rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      All Products
                    </Link>
                    {flatCategories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat._id}`}
                        className="block rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden opacity-80 hover:opacity-100"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
              <button
                onClick={() => router.push("/search")}
                className="inline-flex items-center justify-center text-black  hover:text-gray-600 cursor-pointer transition-colors"
                title="Search products"
                aria-label="Search products"
              >
                <FiSearch size={20} />
              </button>
            </div>

            {/* Exact Centered Logo & Tagline */}
            <Link
              href="/"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10 group"
            >
              <Image
                src={siteLogo}
                alt="Homy Organic"
                width={200}
                height={100}
                priority
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
                sizes="(max-width: 768px) 160px, 200px"
                className="max-h-14 sm:max-h-16 md:max-h-18 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-[8.5px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.22em] font-semibold text-[#B9853A] uppercase mt-0.5 whitespace-nowrap">
                {tagline}
              </span>
            </Link>

            {/* Right items */}
            <div className="flex items-center gap-4 shrink-0 z-10">
              <Link
                href="/track-order"
                className="hidden md:inline-flex items-center text-[15px] font-medium text-[#B9853A] hover:text-black transition-colors"
              >
                Track Order
              </Link>

              <Link
                href="/about"
                className="hidden md:inline-flex items-center text-[15px] font-medium text-black hover:text-gray-600 transition-colors"
              >
                About Us
              </Link>

              <Link
                href="/contact"
                className="hidden md:inline-flex items-center text-[15px] font-medium text-black hover:text-gray-600 transition-colors"
              >
                Contact Us
              </Link>

              <button
                onClick={() => useCartStore.getState().openCart()}
                className="relative inline-flex items-center justify-center  text-black hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="Open cart"
              >
                <FiShoppingBag size={23} />
                {isMounted && totalItems > 0 && (
                  <span
                    className="absolute -top-2 -right-2 text-white text-[10px] rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-semibold"
                    style={{ backgroundColor: "#111827" }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>

              {session?.user?.email ? (
                <div className="relative hidden md:block group">
                  <button className="flex items-center space-x-2  text-black hover:text-gray-600 transition-colors">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                        <FiUser size={20} className="text-black" />
                      </div>
                    )}
                  </button>

                  <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50 origin-top-right text-gray-900">
                    <div className="absolute right-4 top-1.5 w-3.5 h-3.5 bg-white border-t border-l border-gray-100 transform rotate-45 rounded-tl-xs z-10"></div>

                    <div className="relative bg-white border border-gray-100 rounded-2xl py-2 w-64 overflow-hidden z-20">
                      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 text-gray-900">
                        <p className="text-sm font-semibold truncate">
                          {session.user.name || "My Account"}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {session.user.email}
                        </p>
                      </div>

                      <div className="py-2 flex flex-col gap-1 px-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl"
                        >
                          <FiUser className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl"
                        >
                          <FiPackage className="w-4 h-4" />
                          My Orders
                        </Link>
                      </div>

                      <div className="border-t border-gray-50 pt-2 px-2 pb-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="hidden md:inline-flex items-center text-[15px] font-semibold  text-black hover:text-gray-600 transition-colors"
                >
                  Sign In
                </Link>
              )}
              
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-9999 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Slide-in Drawer */}
      <div
        className={`fixed top-0 left-0 h-full transition-transform duration-300 ease-in-out rounded-tr-3xl overflow-hidden w-[80vw] max-w-sm bg-white backdrop-blur-xl z-999999 flex flex-col md:hidden font-[inherit] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b  ">
          {session?.user?.email ? (
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <FiUser size={20} className="text-gray-500" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 text-sm">
                  {session.user.name || "User"}
                </span>
                <span className="text-xs text-gray-500">
                  {session.user.email}
                </span>
              </div>
            </div>
          ) : (
            <span className="font-semibold text-lg">Menu</span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="categories flex flex-col gap-2">
            <div className="flex flex-col ">
              {/* Categories Toggle */}
              <div
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center   text-gray-900 font-medium rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                Categories
                <MdKeyboardArrowDown
                  className={`transition-transform duration-300 ${
                    isCategoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Categories List */}
              {isCategoriesOpen && (
                <div className="flex flex-col gap-2">
                  {flatCategories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/products?category=${cat._id}`}
                      className="flex hover:bg-[#F8F1EA] items-center gap-2 rounded-2xl px-3 py-3 text-xs text-gray-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      < FaRegArrowAltCircleRight/> {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Link
            href="/products?bestSeller=true"
            className="block py-2 text-black hover:text-[#B9853B] font-medium border-b border-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Best Selling
          </Link>
 <Link
            href="/products"
            className="block py-2 text-black hover:text-[#B9853B] font-medium border-b border-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Premium Collection
          </Link>
          <Link
            href="/products?valuePack=true"
            className="block py-2 text-black hover:text-[#B9853B] font-medium border-b border-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Bundles & Deals
          </Link>

         

          <Link
            href="/track-order"
            className="block py-2 text-black hover:text-[#B9853B] font-medium border-b border-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Trace Order
          </Link>

          <Link
            href="/about"
            className="block py-2 text-black hover:text-gray-600 border-b border-gray-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About Us
          </Link>

          <Link
            href="/contact"
            className="block py-2 text-black hover:text-gray-600 border-b border-gray-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact Us
          </Link>

          {session?.user.role === "admin" && (
            <Link
              href="/admin"
              className="block py-2 text-black hover:text-gray-600 border-b border-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => {
              useCartStore.getState().openCart();
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-black hover:text-gray-600 cursor-pointer"
          >
            Cart {totalItems > 0 && `(${totalItems})`}
          </button>

          {session ? (
            <>
              <Link
                href="/profile"
                className="block py-2 text-black hover:text-gray-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/orders"
                className="block py-2 text-black hover:text-gray-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Orders
              </Link>
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/" });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-red-500"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="block w-full text-center py-2 px-4 font-semibold rounded-full bg-[#B9853B] text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
