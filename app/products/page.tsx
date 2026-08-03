import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homyorganic.store";

export const metadata: Metadata = {
  title: "All Products & Organic Collection | Homy Organic Store",
  description:
    "Explore our full collection of organic wellness products, ladies lawn suits, clothing, and bachat bundles on Homy Organic Store.",
  alternates: {
    canonical: `${siteUrl}/products`,
  },
  openGraph: {
    title: "All Products & Organic Collection | Homy Organic Store",
    description:
      "Explore our full collection of organic wellness products, ladies lawn suits, clothing, and bachat bundles.",
    url: `${siteUrl}/products`,
    siteName: "Homy Organic",
    locale: "en_PK",
    type: "website",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
