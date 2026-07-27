export function isCloudinaryUrl(src?: string | null) {
  return typeof src === "string" && src.includes("res.cloudinary.com");
}