"use client";

import { useState } from "react";
import { FiInstagram, FiPlay, FiExternalLink, FiStar } from "react-icons/fi";

export function extractInstagramId(url: string): string {
  if (!url) return "";
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith("http://")) {
    cleanUrl = cleanUrl.replace("http://", "https://");
  }
  const match = cleanUrl.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : "";
}

interface InstagramFeedProps {
  url?: string;
  urls?: string[];
}

export default function InstagramFeed({ url, urls }: InstagramFeedProps) {
  const targetUrl = url || (Array.isArray(urls) && urls[0]) || "https://www.instagram.com/p/DR6x3pajHLu/";
  const postId = extractInstagramId(targetUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const cleanUrl = targetUrl.startsWith("http://")
    ? targetUrl.replace("http://", "https://")
    : targetUrl.startsWith("https://")
    ? targetUrl
    : `https://${targetUrl}`;

  const embedUrl = postId
    ? `https://www.instagram.com/p/${postId}/embed/`
    : cleanUrl;

  return (
    <section className="py-8 sm:py-12 my-2">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          
          {/* Left / Top Side: Header & Review Details */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start justify-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EADBCC] text-[#B9853A] text-xs font-bold uppercase tracking-wider">
              <FiInstagram size={14} />
              <span>@homyorganicpk</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 leading-tight">
              Top Review{" "}
              <span className="font-serif italic text-[#B9853B]">
                on Instagram
              </span>
            </h2>

            <div className="flex items-center gap-1 text-amber-400">
              <FiStar className="fill-amber-400" size={16} />
              <FiStar className="fill-amber-400" size={16} />
              <FiStar className="fill-amber-400" size={16} />
              <FiStar className="fill-amber-400" size={16} />
              <FiStar className="fill-amber-400" size={16} />
              <span className="text-xs text-gray-500 font-semibold ml-2">5.0 Customer Rating</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed max-w-md">
              See real customer experiences, product demonstrations, and honest organic beauty reviews directly from our Instagram community.
            </p>

            <div className="pt-2">
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B9853A] hover:bg-[#9a6d2f] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                <span>Watch on Instagram</span>
                <FiExternalLink size={14} />
              </a>
            </div>

          </div>

          {/* Right / Bottom Side: Single Featured Instagram Reel Video Container */}
          <div className="flex justify-center w-full">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/15] min-h-[380px] sm:min-h-[440px] rounded-2xl overflow-hidden border-2 border-[#B9853A] bg-gray-900 shadow-xs group">
              
              {!isPlaying ? (
                /* Default Poster State with /insta.png & Centered Play Button */
                <div
                  onClick={() => setIsPlaying(true)}
                  className="relative w-full h-full cursor-pointer flex flex-col items-center justify-center overflow-hidden"
                >
                  {/* Poster Thumbnail Image /insta.png */}
                  <img
                    src="/insta.png"
                    alt="Instagram Reel Review"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/bachatpack.png";
                    }}
                  />

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />

                  {/* Play Button Overlay */}
                  <div className="absolute z-10 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#B9853A] text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#9a6d2f] transition-all cursor-pointer"
                      aria-label="Play Reel Video"
                    >
                      <FiPlay size={26} className="ml-1 fill-white" />
                    </button>
                    <span className="text-xs font-bold text-white tracking-wider uppercase drop-shadow-md">
                      Play Review Video
                    </span>
                  </div>
                </div>
              ) : (
                /* Active Video Embed State (Fetched on Click) */
                <>
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 animate-pulse p-4 text-center space-y-2">
                      <FiPlay size={24} className="text-[#B9853A]" />
                      <span className="text-xs font-semibold text-gray-500">Loading Reel...</span>
                    </div>
                  )}

                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 rounded-2xl"
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    onLoad={() => setIframeLoaded(true)}
                    title="Top Review on Instagram"
                  />
                </>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}