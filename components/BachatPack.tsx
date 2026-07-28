import React from "react";
import Image from "next/image";

export default function BachatPack() {
  return (
    <div className="grid md:grid-cols-2  max-w-7xl mx-auto">
      <div>
        <h2 className="text-4xl text-center md:px-33 pt-33 font-light tracking-tight text-white md:text-6xl">
           Beauty Essentials {" "}
          <span className="font-serif italic text-[#B9853B]">
           Value Pack
          </span>
           
        </h2>
        <p className="text-center p-3">
            A complete beauty essentials value pack from Homy Orgaic, featuring carefully selected hair and skin care essentials along with a premium silk scrunchie for an elegant and effortless self-care experience.

        </p>
        
      </div>
      <div>
        <Image src="/bachatpack.png" alt="bachatpack" width={543} height={543} />
      </div>
    </div>
  );
}
