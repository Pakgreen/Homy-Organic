"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppWidget() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/auth");

  useEffect(() => {
    setIsMounted(true);
    const fetchSiteSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings/site");
        const num = data.whatsappNumber || data.contactPhone || "+923001234567";
        setWhatsappNumber(num);
      } catch (error) {
        console.error("Failed to load WhatsApp settings:", error);
        setWhatsappNumber("+923001234567");
      }
    };
    fetchSiteSettings();
  }, []);

  if (!isMounted || isAdminPage || isAuthPage) return null;

  // Clean phone number for wa.me link (remove spaces, +, -, etc.)
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999] pointer-events-auto">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <FaWhatsapp size={30} className="text-white" />
      </a>
    </div>
  );
}
