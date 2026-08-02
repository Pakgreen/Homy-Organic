import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function BachatPack() {
  return (
    <div className="relative max-w-7xl mx-auto overflow-hidden rounded-3xl">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_50%,rgba(185,133,59,0.25),transparent_45%),radial-gradient(circle_at_20%_20%,rgba(185,133,59,0.12),transparent_40%)]" />

      <div className="grid md:grid-cols-2 p-4 sm:p-6 items-center">
        <div className="flex flex-col justify-center items-center text-center p-4 sm:p-6 space-y-4">
          <h2 className="text-4xl text-center font-light tracking-tight text-white md:text-6xl">
            Beauty Essentials{" "}
            <span className="font-serif italic text-[#B9853B]">
              Value Pack
            </span>
          </h2>

          <p className="text-center p-2 text-black/90 font-medium text-sm sm:text-base max-w-md">
            A complete beauty essentials value pack from Homy Organic, featuring
            carefully selected hair and skin care essentials along with a premium
            silk scrunchie for an elegant and effortless self-care experience.
          </p>

          <div className="pt-2">
            <Link
              href="/products?valuePack=true"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#B9853B] hover:bg-[#9a6d2f] text-white font-medium text-sm sm:text-base rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Shop Now
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center overflow-hidden">
          <Image
            src="/bachatpack.png"
            alt="bachatpack"
            width={543}
            height={543}
            className="animate-[slideInRight_1s_ease-out]"
          />
        </div>
      </div>
    </div>
  );
}