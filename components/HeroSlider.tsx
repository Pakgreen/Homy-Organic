"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";
// @ts-ignore
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { isCloudinaryUrl, getOptimizedImageUrl } from "@/lib/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface SliderItem {
  _id: string;
  title: string;
  image: string;
  desktopImage?: string;
  buttonText: string;
  buttonLink: string;
}

interface HeroSliderProps {
  initialSliders?: SliderItem[];
}

export default function HeroSlider({
  initialSliders = [],
}: HeroSliderProps) {
  const [sliders, setSliders] = useState<SliderItem[]>(initialSliders);
  const [isLoading, setIsLoading] = useState(initialSliders.length === 0);

  useEffect(() => {
    if (initialSliders.length === 0) {
      fetchSliders(true);
    }
  }, [initialSliders.length]);

  const fetchSliders = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const res = await axios.get("/api/sliders");
      let data = Array.isArray(res.data) ? res.data : res.data.sliders || [];
      data = data.filter(
        (slider: any) => slider.image && slider.image.trim() !== ""
      );
      setSliders(data);
    } catch (error) {
      console.error("Error fetching sliders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden w-full max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-0 md:px-4 lg:px-6 xl:px-8 2xl:px-10 py-0 md:py-4">
        <div className="w-full h-44 sm:h-72 md:h-[480px] lg:h-[560px] xl:h-[650px] 2xl:h-[760px] 3xl:h-[860px] rounded-none md:rounded-3xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-0 md:px-4 lg:px-6 xl:px-8 2xl:px-10 py-0 md:py-4">
      <div className="relative group rounded-none md:rounded-3xl overflow-hidden md:shadow-md border-0 md:border md:border-gray-100/80 bg-gray-50">
        
        {/* Desktop & Tablet Left/Right Navigation Buttons */}
        {sliders.length > 1 && (
          <>
            <button
              type="button"
              className="hero-prev-btn hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/85 hover:bg-white text-gray-900 border border-gray-200/80 shadow-lg items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Previous Banner"
            >
              <FiChevronLeft className="w-7 h-7 lg:w-8 lg:h-8 text-gray-800 -ml-0.5" />
            </button>

            <button
              type="button"
              className="hero-next-btn hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/85 hover:bg-white text-gray-900 border border-gray-200/80 shadow-lg items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Next Banner"
            >
              <FiChevronRight className="w-7 h-7 lg:w-8 lg:h-8 text-gray-800 -mr-0.5" />
            </button>
          </>
        )}

        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={{
            prevEl: ".hero-prev-btn",
            nextEl: ".hero-next-btn",
          }}
          loop={sliders.length > 1}
          key={sliders.map((s) => s._id).join("-")}
          className="w-full h-auto rounded-none md:rounded-3xl overflow-hidden"
          slidesPerView={1}
          spaceBetween={0}
        >
          {sliders.map((slider, idx) => {
            const mobileImg = getOptimizedImageUrl(slider.image, 800, "auto");
            const desktopImg = getOptimizedImageUrl(slider.desktopImage || slider.image, 2560, "auto");

            return (
              <SwiperSlide key={slider._id}>
                <div className="relative w-full overflow-hidden rounded-none md:rounded-3xl">
                  {/* Mobile Image View (Edge to Edge, No Rounded Corners) */}
                  <img
                    src={mobileImg}
                    alt={slider.title || "Mobile Banner"}
                    loading={idx === 0 ? "eager" : "lazy"}
                    // @ts-ignore
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    decoding="async"
                    className="w-full h-auto block object-contain md:hidden rounded-none"
                  />

                  {/* Desktop & Tablet Banner View (Extra Large Responsive Height for Laptops & Widescreen Monitors) */}
                  <img
                    src={desktopImg}
                    alt={slider.title || "Desktop Banner"}
                    loading={idx === 0 ? "eager" : "lazy"}
                    // @ts-ignore
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    decoding="async"
                    className="hidden md:block w-full h-[420px] md:h-[480px] lg:h-[560px] xl:h-[650px] 2xl:h-[760px] 3xl:h-[860px] object-cover rounded-3xl"
                  />

                  <Link
                    href={slider.buttonLink || "#"}
                    aria-label={slider.title || "Slide"}
                    className="absolute inset-0 z-10"
                  />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          width: 12px;
          height: 12px;
        }

        .swiper-pagination-bullet-active {
          background: #000000;
          width: 32px;
          border-radius: 6px;
        }

        .swiper-pagination {
          width: auto;
          left: auto;
          right: 1rem;
          bottom: 0.75rem;
          text-align: right;
        }
        @media (min-width: 640px) {
          .swiper-pagination {
            right: 1.25rem;
            bottom: 1rem;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </section>
  );
}