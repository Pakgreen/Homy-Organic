/**
 * Utility helper to generate WhatsApp order message and open WhatsApp chat
 */

import { siteConfig } from "@/config/site.config";

export function generateOrderWhatsAppMessage(order: any): string {
  const customerName =
    order?.shippingAddress?.fullName ||
    order?.user?.name ||
    "Valued Customer";
  
  const shortId = order?._id ? String(order._id).substring(0, 8) : "N/A";
  
  const siteUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://homyorganic.store");

  const supportPhone = siteConfig?.contact?.phone || "+92 302 3735860";
  const supportEmail = siteConfig?.contact?.email || "info@homyorganic.com";

  let msg = `Hi ${customerName}, regarding your order #${shortId} at Homy Organic...\n\n`;
  msg += `Your order has been successfully confirmed!\n`;
  msg += `If you did not place this order or wish to verify/cancel it, please contact our support team immediately at ${supportPhone} or email ${supportEmail}.\n\n`;

  msg += `ORDER DETAILS:\n`;
  if (Array.isArray(order?.orderItems) && order.orderItems.length > 0) {
    order.orderItems.forEach((item: any, idx: number) => {
      const itemName = item.name || "Product Item";
      const itemQty = item.quantity || 1;
      const itemPrice = item.price ? `PKR ${item.price}` : "";
      
      const productSlug = item.slug || item.product?.slug || item.product || "";
      const productUrl = productSlug
        ? (String(productSlug).startsWith("http")
            ? productSlug
            : `${siteUrl}/products/${productSlug}`)
        : "";

      msg += `${idx + 1}. ${itemName} (Qty: ${itemQty}) ${itemPrice ? `- ${itemPrice}` : ""}\n`;
      if (productUrl) {
        msg += `   Product Link: ${productUrl}\n`;
      }
    });
  } else {
    msg += `• Order items recorded.\n`;
  }

  msg += `\nSUMMARY:\n`;
  msg += `Total Amount: PKR ${order?.totalPrice || 0}\n`;
  if (order?.paymentMethod) {
    msg += `Payment Method: ${String(order.paymentMethod).toUpperCase()}\n`;
  }
  if (order?.shippingAddress?.address) {
    msg += `Delivery Address: ${order.shippingAddress.address}, ${order.shippingAddress.city || ""}\n`;
  }

  msg += `\nSupport Contact: ${supportPhone}\n`;
  msg += `Support Email: ${supportEmail}\n`;
  msg += `Website: ${siteUrl}\n\n`;
  msg += `Thank you for shopping with Homy Organic.`;

  return msg;
}

export function openOrderWhatsApp(order: any) {
  if (!order?.shippingAddress?.phone) return;

  let num = String(order.shippingAddress.phone).replace(/[^0-9]/g, "");
  if (num.startsWith("0")) num = "92" + num.slice(1);
  else if (!num.startsWith("92")) num = "92" + num;

  const msg = generateOrderWhatsAppMessage(order);
  const waUrl = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");
}
