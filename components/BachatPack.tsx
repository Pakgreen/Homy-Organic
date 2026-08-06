import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function BachatPack() {
  return (
    <div className="relative w-full max-w-[95%] lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1750px] mx-auto overflow-hidden rounded-3xl sm:rounded-[36px]">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_50%,rgba(185,133,59,0.25),transparent_45%),radial-gradient(circle_at_20%_20%,rgba(185,133,59,0.12),transparent_40%)]" />

      <div className="grid md:grid-cols-2 p-4 sm:p-6 lg:p-10 xl:p-14 items-center">
        <div className="flex flex-col justify-center items-center text-center p-4 sm:p-6 lg:p-8 space-y-4 lg:space-y-6">
          <h2 className="text-4xl text-center font-light tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
            Beauty Essentials{" "}
            <span className="font-serif italic text-[#B9853B]">Value Pack</span>
          </h2>

          <p className="text-center p-2 text-black/90 font-medium text-sm sm:text-base lg:text-lg xl:text-xl max-w-md lg:max-w-xl xl:max-w-2xl">
            A complete beauty essentials value pack from Homy Organic, featuring
            carefully selected hair and skin care essentials along with a
            premium silk scrunchie for an elegant and effortless self-care
            experience.
          </p>

          <div className="pt-2">
            <Link
              href="/products?valuePack=true"
              className="inline-flex items-center justify-center px-8 py-3.5 lg:px-10 lg:py-4 bg-[#B9853B] hover:bg-[#9a6d2f] text-white font-medium text-sm sm:text-base lg:text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Shop Now
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center overflow-hidden">
          <Image
            src="/bachatpack.png"
            alt="bachatpack"
            width={650}
            height={650}
            className="w-full max-w-[543px] xl:max-w-[650px] h-auto object-contain animate-[slideInRight_1s_ease-out]"
          />
        </div>
      </div>
    </div>
  );
}
