export type ProductImageVariant = {
  url: string;
  name: string;
  index: number;
};

const cleanText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export function buildProductImageVariants(product: any): ProductImageVariant[] {
  const images = Array.isArray(product?.images)
    ? product.images.filter(
        (image: unknown): image is string =>
          typeof image === "string" && image.trim().length > 0,
      )
    : [];

  const labels = Array.isArray(product?.imageLabels) ? product.imageLabels : [];

  return images.map((url: string, index: number) => ({
    url,
    index,
    name: cleanText(labels[index]) || `Design ${index + 1}`,
  }));
}