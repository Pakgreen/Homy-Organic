import { Suspense } from "react";
import HeroSlider from "@/components/HeroSlider";
import BestSellingProducts from "@/components/home/BestSellingProducts";
import ProductsContent from "@/components/home/ProductsContent";
import ValuePacksContent from "@/components/home/ValuePacksContent";
import FAQAccordion from "@/components/FAQAccordion";
import About from "@/components/About";
import Testimonials from "@/components/Testimonial";
import BachatPack from "@/components/BachatPack";
import InstagramFeed from "@/components/IntagramComp";
import ProductSkeleton from "@/components/ProductSkeleton";
import connectDB from "@/lib/mongodb";
import Slider from "@/models/Slider";
import CategoryNav from "@/components/home/Category";

async function getSliders() {
  try {
    await connectDB();
    const sliders = await Slider.find({ isActive: true }).sort("order").lean();
    return JSON.parse(JSON.stringify(sliders)).filter(
      (slider: any) => slider.image && slider.image.trim() !== ""
    );
  } catch (error) {
    console.error("Home slider direct DB fetch error:", error);
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

  return (
    <>
      <HeroSlider initialSliders={allSliders} />
     <CategoryNav/>
      <About />
 <BestSellingProducts />
      <Suspense fallback={<ProductSkeleton count={10} />}>
        <ProductsContent />
      </Suspense>

      <ValuePacksContent />

      <BachatPack />
      
      <InstagramFeed urls={instagramReels} />

      <Testimonials />
      <FAQAccordion />
    </>
  );
}
