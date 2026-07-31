"use client";

import { useEffect, useState } from "react";

export default function PagePreloader() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const handleComplete = () => {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    };

    if (document.readyState === "complete") {
      const initialTimer = setTimeout(handleComplete, 400);
      return () => clearTimeout(initialTimer);
    } else {
      window.addEventListener("load", handleComplete);
      const maxTimer = setTimeout(handleComplete, 1800);

      return () => {
        window.removeEventListener("load", handleComplete);
        clearTimeout(maxTimer);
      };
    }
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-white transition-opacity duration-400 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ultra-minimal low-brightness thin-line gray circular spinner */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 border-[1.5px] border-gray-100 border-t-gray-400 border-r-gray-400 rounded-full animate-spin" />
    </div>
  );
}
