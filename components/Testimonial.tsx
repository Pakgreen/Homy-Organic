"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

const testimonials = [
  {
    text: "Oil ki quality bohat achi hai. Packaging bhi premium hai aur delivery time par mil gayi. Main dobara bhi order karungi.",
    name: "Areeba Khan",
    company: "Lahore, Pakistan",
  },
  {
    text: "Maine pehli dafa ye oil try kiya aur result bohat acha raha. Product original hai aur quality bhi expected se kaafi better hai.",
    name: "Hania Ahmed",
    company: "Karachi, Pakistan",
  },
  {
    text: "Bohat zabardast quality ka oil hai. Khushboo achi hai aur product bilkul fresh laga. Overall experience bohat acha raha.",
    name: "Eman Fatima",
    company: "Dubai, UAE",
  },
  {
    text: "Mujhe product ki quality sab se zyada pasand aayi. Order karna easy tha aur parcel bhi safely receive ho gaya.",
    name: "Maham Ali",
    company: "Abu Dhabi, UAE",
  },
  {
    text: "Main is oil ko kuch time se use kar rahi hoon aur mujhe iska result bohat acha laga. Quality aur packaging dono excellent hain.",
    name: "Zoya Malik",
    company: "Islamabad, Pakistan",
  },
  {
    text: "Achi quality, reasonable price aur fast delivery. Product bilkul waisa hi mila jaisa website par show kiya gaya tha.",
    name: "Laiba Iqbal",
    company: "Sharjah, UAE",
  },
];



export default function Testimonials() {
  return (
    <section className="w-full overflow-hidden py-20">
      {/* Heading */}
      <div className="mb-16 text-center">
        <h2 className="text-4xl font-light tracking-tight text-white md:text-6xl">
          What Our{" "}
          <span className="font-serif italic text-gray-400">
            Clients Say
          </span>
        </h2>
      </div>

      {/* Slider */}
      <Swiper
        modules={[Autoplay]}
        loop={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        speed={800}
        spaceBetween={24}
        slidesPerView={1.2}
        centeredSlides={true}
        breakpoints={{
          640: {
            slidesPerView: 2,
            centeredSlides: false,
          },
          1024: {
            slidesPerView: 3,
            centeredSlides: false,
          },
          1280: {
            slidesPerView: 4,
            centeredSlides: false,
          },
        }}
        className="!overflow-visible"
      >
        {testimonials.map((testimonial, index) => (
          <SwiperSlide key={index}>
            <div className="group min-h-[300px] rounded-3xl border border-white/10 p-8 transition-all duration-500 hover:border-white/20">
              {/* Stars */}
              <div className="mb-7 flex gap-1 text-gray-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-lg">
                    ★
                  </span>
                ))}
              </div>

              {/* Testimonial */}
              <p className="text-base font-light italic leading-7 text-gray-400">
                “{testimonial.text}”
              </p>

              {/* User */}
              <div className="mt-8 flex items-center gap-4">
                {/* Avatar placeholder */}
                <div className="h-12 w-12 shrink-0 rounded-full bg-white/10" />

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {testimonial.name}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}