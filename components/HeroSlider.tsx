"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";
// @ts-ignore
import "swiper/css/navigation";
// @ts-ignore
import "swiper/css/effect-fade";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { isCloudinaryUrl } from "@/lib/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface SliderItem {
  _id: string;
  title: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}

interface HeroSliderProps {
  initialSliders?: SliderItem[];
  position?: string;
}

export default function HeroSlider({
  initialSliders = [],
  position = "top",
}: HeroSliderProps) {
  const [sliders, setSliders] = useState<SliderItem[]>(initialSliders);
  const [isLoading, setIsLoading] = useState(initialSliders.length === 0);

  useEffect(() => {
    // Always refresh once on mount to pick up latest sliders
    fetchSliders(initialSliders.length === 0);
  }, [initialSliders.length]);

  const fetchSliders = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const res = await axios.get("/api/sliders");
      // Handle both formats: array directly or object with sliders property
      let data = Array.isArray(res.data) ? res.data : res.data.sliders || [];
      // Filter out sliders without images and by position
      data = data.filter(
        (slider: any) =>
          slider.image &&
          slider.image.trim() !== "" &&
          (position === "top"
            ? !slider.position || slider.position === "top"
            : slider.position === position),
      );
      setSliders(data);
    } catch (error) {
      console.error("Error fetching sliders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isTop = position === "top";

  if (isLoading) {
    return (
      <section
        className={`relative overflow-hidden w-full ${isTop ? "px-0 py-0" : "px-4 sm:px-6 lg:px-8 py-4"}`}
      >
        <div
          className={`w-full mt-3 bg-gray-200 animate-pulse overflow-hidden ${
            isTop
              ? "aspect-16/9 sm:aspect-21/9 min-h-[250px] sm:min-h-[400px] rounded-none"
              : "h-[22vh] sm:h-[38vh] md:h-[45vh] min-h-[180px] max-h-[380px] rounded-2xl sm:rounded-3xl"
          }`}
        />
      </section>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  return (
    <section
      className={`relative overflow-hidden w-full ${isTop ? "px-0 py-0" : "px-4 sm:px-6 lg:px-8 py-4"}`}
    >
      <div
        className={`relative overflow-hidden ${isTop ? "rounded-none" : "rounded-2xl sm:rounded-3xl"}`}
      >
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect={isTop ? "fade" : "slide"}
          fadeEffect={{ crossFade: true }}
          speed={1000}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={{
            prevEl: `.hero-prev-${position}`,
            nextEl: `.hero-next-${position}`,
          }}
          loop={sliders.length > 1}
          autoHeight={isTop}
          key={sliders.map((s) => s._id).join("-")}
          className={`w-full bg-gray-100 ${
            isTop
              ? "h-auto"
              : "h-[22vh] sm:h-[38vh] md:h-[45vh] min-h-[180px] max-h-[380px]"
          }`}
          slidesPerView={1}
          spaceBetween={0}
          centeredSlides={false}
        >
          {sliders.map((slider, index) => (
            <SwiperSlide key={slider._id}>
              <div className={`relative w-full ${isTop ? "h-auto" : "h-full"} overflow-hidden`}>
                {isTop ? (
                  <img
                    src={slider.image}
                    alt={slider.title || "Slider image"}
                    className="w-full h-auto block object-contain animate-hero-fade"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <Image
                    src={slider.image}
                    alt={slider.title}
                    fill
                    sizes="100vw"
                    quality={95}
                    unoptimized={isCloudinaryUrl(slider.image)}
                    className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                    loading={index === 0 ? "eager" : "lazy"}
                    priority={index === 0}
                  />
                )}
                <Link
                  href={slider.buttonLink || "#"}
                  aria-label={slider.title || "Slide"}
                  className="absolute inset-0"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Side Arrow Navigation Buttons */}
        <button
          className={`hero-prev-${position} absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-white/85 hover:bg-white text-gray-900 shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer border border-gray-100/50`}
          aria-label="Previous slide"
        >
          <FiChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
        </button>
        <button
          className={`hero-next-${position} absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-white/85 hover:bg-white text-gray-900 shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer border border-gray-100/50`}
          aria-label="Next slide"
        >
          <FiChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
        </button>
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

        /* Move pagination to bottom-right, especially on mobile */
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

        @keyframes heroFadeInOut {
          0% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.015);
          }
          100% {
            opacity: 0.9;
            transform: scale(1);
          }
        }

        .animate-hero-fade {
          animation: heroFadeInOut 7s ease-in-out infinite;
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
