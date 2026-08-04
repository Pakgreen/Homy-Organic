export function isCloudinaryUrl(src?: string | null) {
  return typeof src === "string" && src.includes("res.cloudinary.com");
}

export function getOptimizedImageUrl(
  src?: string | null,
  width = 380,
  quality = "auto:eco"
): string {
  if (!src || typeof src !== "string" || !src.trim()) return "/homyorganic.png";

  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const uploadIndex = src.indexOf("/upload/");
    const prefix = src.substring(0, uploadIndex + 8);
    let rest = src.substring(uploadIndex + 8);

    // Clean up existing transformation parameters to apply the requested width and quality
    while (/^(f_|q_|w_|c_|h_|dpr_)[^/]+\//.test(rest)) {
      rest = rest.replace(/^[^/]+\//, "");
    }

    return `${prefix}f_auto,q_${quality},w_${width},c_limit/${rest}`;
  }

  return src;
}