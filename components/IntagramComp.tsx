"use client";

import { useRef, useState } from "react";
import { FiInstagram, FiChevronLeft, FiChevronRight, FiPlay, FiExternalLink } from "react-icons/fi";

export function extractInstagramId(url: string): string {
  if (!url) return "";
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith("http://")) {
    cleanUrl = cleanUrl.replace("http://", "https://");
  }
  const match = cleanUrl.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : "";
}

interface SingleInstaEmbedProps {
  url: string;
}

export function SingleInstagramCard({ url }: SingleInstaEmbedProps) {
  const postId = extractInstagramId(url);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const cleanUrl = url.startsWith("http://")
    ? url.replace("http://", "https://")
    : url.startsWith("https://")
    ? url
    : `https://${url}`;

  const embedUrl = postId
    ? `https://www.instagram.com/p/${postId}/embed/`
    : cleanUrl;

  return (
    <div className="w-[195px] sm:w-[270px] shrink-0 snap-start flex flex-col space-y-1.5 group">
      
      {/* Compact Minimal Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 flex items-center justify-center text-white shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-rose-600">
              <FiInstagram size={10} className="sm:text-[11px]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-gray-900 tracking-tight truncate max-w-[100px] sm:max-w-none">
            homyorganic
          </span>
        </div>

        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#B9853A] hover:bg-[#9a6d2f] text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          View <FiExternalLink size={9} />
        </a>
      </div>

      {/* Compact 9:16 Reel Player Frame (Mobile: 195px x 310px, Desktop: 270px x 400px) */}
      <div className="relative w-full aspect-[9/15] min-h-[310px] sm:min-h-[400px] rounded-2xl overflow-hidden border-2 border-[#B9853A] bg-gray-50 transition-all duration-300 group-hover:ring-4 group-hover:ring-[#B9853A]/15">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 animate-pulse p-3 text-center space-y-1.5">
            <FiPlay size={22} className="text-[#B9853A]" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500">Loading Reel...</span>
          </div>
        )}

        <iframe
          src={embedUrl}
          className="w-full h-full border-0 rounded-2xl"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          onLoad={() => setIframeLoaded(true)}
          title="Customer Review on Instagram"
        />
      </div>

    </div>
  );
}

interface InstagramFeedProps {
  urls?: string[];
}

export default function InstagramFeed({ urls }: InstagramFeedProps) {
  const defaultUrls = [
    "https://www.instagram.com/p/DR6x3pajHLu/",
    "https://www.instagram.com/p/DR6x3pajHLu/",
    "https://www.instagram.com/p/DR6x3pajHLu/",
    "https://www.instagram.com/p/DR6x3pajHLu/",
  ];

  const postList = Array.isArray(urls) && urls.length > 0 ? urls : defaultUrls;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-6 sm:py-8 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
        
        {/* Section Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B9853A] inline-block" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#B9853A]">
                Customer Reviews
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
              Customer Review on Instagram
            </h2>
          </div>

          {/* Minimal Controls for Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-[#B9853A]/40 bg-white text-[#B9853A] hover:bg-[#B9853A] hover:text-white transition-all cursor-pointer"
              aria-label="Previous Review"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-[#B9853A]/40 bg-white text-[#B9853A] hover:bg-[#B9853A] hover:text-white transition-all cursor-pointer"
              aria-label="Next Review"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Reel Slider with Mobile Touch pan */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth touch-pan-x pb-2 px-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {postList.map((url, idx) => (
            <SingleInstagramCard key={`${url}-${idx}`} url={url} />
          ))}
        </div>

      </div>
    </section>
  );
}