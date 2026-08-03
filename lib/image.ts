export function isCloudinaryUrl(src?: string | null) {
  return typeof src === "string" && src.includes("res.cloudinary.com");
}

export function getOptimizedImageUrl(
  src?: string | null,
  width = 400,
  quality = "auto:eco"
): string {
  if (!src || typeof src !== "string") return "/homyorganic.png";
  
  // Handle Cloudinary URLs for auto WebP/AVIF format and auto quality + scaling
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    if (src.includes("/f_auto,q_")) {
      return src;
    }
    return src.replace(
      "/upload/",
      `/upload/f_auto,q_${quality},w_${width},c_limit/`
    );
  }
  
  return src;
}