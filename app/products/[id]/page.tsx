import type { Metadata } from "next";
import ProductClient from "./ProductClient";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL?.startsWith("http")
    ? process.env.VERCEL_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://homyorganic.store");

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
        title: "Product Details | Homy Organic",
        description: "View product details on Homy Organic Store",
      };
    }

    const product = await res.json();
    const image = product?.images?.[0] || product?.image;
    const title = product?.name ? `${product.name} | Homy Organic` : "Product";
    const description =
      product?.description?.replace(/<[^>]*>?/gm, "").slice(0, 160) ||
      `Buy ${product?.name || "Product"} online at best price from Homy Organic.`;
    const url = `${baseUrl}/products/${id}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: "Homy Organic",
        type: "article",
        images: image
          ? [
              {
                url: image,
                width: 800,
                height: 800,
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
      title: "Product Details | Homy Organic",
      description: "View product details on Homy Organic Store",
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

  let productData = null;
  try {
    const res = await fetch(`${baseUrl}/api/products/${id}`, { cache: "no-store" });
    if (res.ok) {
      productData = await res.json();
    }
  } catch (e) {}

  const productSchema = productData
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: productData.name,
        image: productData.images || [productData.image],
        description: productData.description?.replace(/<[^>]*>?/gm, "") || productData.name,
        sku: productData._id,
        brand: {
          "@type": "Brand",
          name: "Homy Organic",
        },
        offers: {
          "@type": "Offer",
          url: `${baseUrl}/products/${id}`,
          priceCurrency: "PKR",
          price: productData.price,
          availability:
            productData.countInStock > 0 || productData.inStock !== false
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema),
          }}
        />
      )}
      <ProductClient productId={id} />
    </>
  );
}
