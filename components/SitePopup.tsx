"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SitePopup() {
  const [show, setShow] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Only fetch if they haven't closed it in this session
    const hasSeenPopup = sessionStorage.getItem("hasSeenPopup");

    // Don't show admin popups inside admin dashboard routes
    if (pathname?.startsWith("/admin")) return;

    if (!hasSeenPopup) {
      const fetchPopup = async () => {
        try {
          const { data } = await axios.get("/api/settings/popup");
          if (data?.enabled && data?.image) {
            setPopupData(data);
            // Slight delay so the user sees the page first
            setTimeout(() => {
              setShow(true);
            }, 1000);
          }
        } catch (error) {
          console.error("Failed to load popup");
        }
      };

      fetchPopup();
    }
  }, [pathname]);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("hasSeenPopup", "true");
  };

  if (!show || !popupData) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleClose}
    >
      <div
        className="relative max-w-lg w-full max-h-[90vh] animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Close Popup"
          onClick={handleClose}
          className="absolute -top-3 cursor-pointer -right-3 z-10 w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 hover:scale-105 transition-all shadow-md border-2 border-white"
        >
          <FiX size={18} />
        </button>

        {popupData.link ? (
          <Link
            href={popupData.link}
            onClick={handleClose}
            className="block w-full"
          >
            <img
              src={popupData.image}
              alt="Promotional Popup"
              className="w-full h-auto object-contain max-h-[85vh] cursor-pointer rounded-lg shadow-lg"
            />
          </Link>
        ) : (
          <img
            src={popupData.image}
            alt="Promotional Popup"
            className="w-full h-auto object-contain max-h-[85vh] rounded-lg shadow-lg block"
          />
        )}
      </div>
    </div>
  );
}
