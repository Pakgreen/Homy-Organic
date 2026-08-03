"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

const testimonials = [
  {
    text: "The quality of the oil is excellent. The packaging is premium, and my order was delivered on time. I will definitely order again.",
    name: "Areeba Khan",
    company: "Lahore, Pakistan",
  },
  {
    text: "This was my first time trying this oil, and I was very impressed. The product is authentic, and the quality exceeded my expectations.",
    name: "Hania Ahmed",
    company: "Karachi, Pakistan",
  },
  {
    text: "The oil is of outstanding quality. It has a pleasant fragrance, and the product felt fresh. Overall, I had a great experience.",
    name: "Eman Fatima",
    company: "Dubai, UAE",
  },
  {
    text: "What I liked most was the product quality. Ordering was simple, and the package arrived safely and in perfect condition.",
    name: "Maham Ali",
    company: "Abu Dhabi, UAE",
  },
  {
    text: "I have been using this oil for some time now, and the results have been very satisfying. Both the quality and packaging are excellent.",
    name: "Zoya Malik",
    company: "Islamabad, Pakistan",
  },
  {
    text: "Excellent quality, reasonable price, and fast delivery. The product was exactly as shown on the website.",
    name: "Laiba Iqbal",
    company: "Sharjah, UAE",
  },
];



export default function Testimonials() {
  return (
    <section className="w-full overflow-hidden py-5">
      {/* Heading */}
      <div className="mb-1 text-center">
        <h2 className="text-4xl font-light tracking-tight text-white md:text-6xl">
          What Our{" "}
          <span className="font-serif italic text-[#B9853B]">
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