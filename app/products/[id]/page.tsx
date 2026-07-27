import type { Metadata } from "next";
import ProductClient from "./ProductClient";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL?.startsWith("http")
    ? process.env.VERCEL_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  try {
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Product",
        description: "Product details",
      };
    }

    const product = await res.json();
    const image = product?.images?.[0];
    const title = product?.name || "Product";
    const description = product?.description || "Product details";
    const url = `${baseUrl}/products/${id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: "website",
        images: image
          ? [
              {
                url: image,
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    console.error("Metadata fetch error", error);
    return {
      title: "Product",
      description: "Product details",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  return <ProductClient productId={id} />;
}
