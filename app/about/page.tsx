import { Metadata } from "next";
import Setting from "@/models/Setting";
import connectDB from "@/lib/mongodb";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about our brand.",
};

export const revalidate = 60; // Revalidate every minute

async function getAboutData() {
  try {
    await connectDB();
    const settings = await Setting.findOne({ key: "site" });
    return (
      settings?.value?.aboutUsText ||
      "We are a passion-driven brand dedicating our time to provide the best quality products for our customers."
    );
  } catch (error) {
    return "We are a passion-driven brand dedicating our time to provide the best quality products for our customers.";
  }
}

export default async function AboutPage() {
  const aboutText = await getAboutData();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
        <h1 className="text-3xl md:text-5xl font-light text-gray-900 uppercase tracking-widest mb-12 text-center">
          About Us
        </h1>

        <div className="border-t border-b border-gray-100 py-12 md:py-20 text-center">
          <p className="text-sm md:text-base font-light text-gray-600 leading-loose max-w-2xl mx-auto whitespace-pre-wrap">
            {aboutText}
          </p>
        </div>

        <div className="mt-20 flex justify-center">
          <a
            href="/products"
            className="inline-block px-8 py-4 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Explore Our Collection
          </a>
        </div>
      </div>
    </div>
  );
}
