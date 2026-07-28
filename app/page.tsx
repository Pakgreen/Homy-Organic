import { Suspense } from "react";
import HeroSlider from "@/components/HeroSlider";

import ProductsContent from "@/components/home/ProductsContent";
import FAQAccordion from "@/components/FAQAccordion";
import About from "@/components/About";
import Testimonials from "@/components/Testimonial";
import BachatPack from "@/components/BachatPack";
import InstagramFeed from "@/components/IntagramComp";

async function getSliders() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/sliders`, {
      // Always fetch fresh so all new sliders appear
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Slider fetch failed with status ${res.status}`);
    }

    const payload = await res.json();
    let data = Array.isArray(payload) ? payload : payload.sliders || [];
    return data.filter(
      (slider: any) => slider.image && slider.image.trim() !== "",
    );
  } catch (error) {
    console.error("Home slider fetch error:", error);
    return [];
  }
}

export default async function ProductsPage() {
  const instagramReels = [
    "https://www.instagram.com/p/DR6x3pajHLu/",
    "https://www.instagram.com/p/DR6x3pajHLu/",
    "https://www.instagram.com/p/DR6x3pajHLu/",
  ];
  const allSliders = await getSliders();
  const heroSliders = allSliders.filter(
    (s: any) => !s.position || s.position === "top",
  );

  return (
    <>
      <HeroSlider initialSliders={heroSliders} position="top" />
      <About />

      <Suspense fallback={null}>
        <ProductsContent />
      </Suspense>
      <BachatPack />
      
      <InstagramFeed urls={instagramReels} />

      <Testimonials />
      <FAQAccordion />
    </>
  );
}
