"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NavbarHeadSliderLine({
  isFooter = false,
}: {
  isFooter?: boolean;
}) {
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/banner")
      .then((res) => {
        if (!mounted) return;
        if (res.data?.enabled) {
          setEnabled(true);
          setText(res.data.text || "");
        } else {
          setEnabled(false);
        }
      })
      .catch(() => {
        // ignore, keep defaults
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!enabled) {
    return null;
  }

  if (!isFooter) {
    return (
      <div className="bg-black py-2.5 sm:py-0 sm:h-7 flex w-full items-center justify-center text-center overflow-hidden">
        <span className="text-white text-[10px] uppercase tracking-[0.2em] font-bold px-4 text-center block w-full">
          {text}
        </span>
      </div>
    );
  }


  return (
    <div className="bg-black h-16 sm:h-7 flex items-center justify-center overflow-hidden whitespace-nowrap text-center">
      <div className="sm:animate-marquee flex gap-10 whitespace-nowrap text-white text-[10px] uppercase tracking-[0.2em] font-bold">
        {/* Repeat text multiple times to create a seamless scrolling loop */}
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>
      <div
        className="animate-marquee flex gap-10 whitespace-nowrap text-white text-[10px] uppercase tracking-[0.2em] font-bold"
        aria-hidden="true"
      >
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
