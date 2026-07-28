"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";
// @ts-ignore
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { isCloudinaryUrl } from "@/lib/image";

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

  if (isLoading) {
    return (
      <section className="relative overflow-hidden w-full">
        <div className="w-full aspect-[21/9] bg-gray-200 animate-pulse" />
      </section>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden w-full">
      <div>
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={false}
          loop={sliders.length > 1}
          key={sliders.map((s) => s._id).join("-")}
          className="w-full h-auto bg-gray-100"
          slidesPerView={1}
          spaceBetween={0}
          autoHeight={true}
        >
          {sliders.map((slider) => (
            <SwiperSlide key={slider._id}>
              <div className="relative w-full">
                <img
                  src={slider.image}
                  alt={slider.title || "Banner"}
                  className="w-full h-auto block object-contain"
                />
                <Link
                  href={slider.buttonLink || "#"}
                  aria-label={slider.title || "Slide"}
                  className="absolute inset-0"
                />
              </div>
            </SwiperSlide>
          ))}
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