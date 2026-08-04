export function formatPrice(price: number): string {
  // Format prices in Pakistani Rupees
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function generateSlug(text: string): string {
  if (!text || typeof text !== "string") return "item";
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

  return slug || "item";
}

export async function generateUniqueSlug(
  model: any,
  rawText: string,
  excludeId?: string,
  customSlug?: string
): Promise<string> {
  const baseInput = customSlug && customSlug.trim() ? customSlug : rawText;
  const baseSlug = generateSlug(baseInput);

  let currentSlug = baseSlug;
  let counter = 1;

  while (true) {
    const query: any = { slug: currentSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await model.findOne(query).select("_id").lean();
    if (!existing) {
      return currentSlug;
    }

    counter++;
    currentSlug = `${baseSlug}-${counter}`;
  }
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function getRandomImage(category: string = "book"): string {
  return "";
}
