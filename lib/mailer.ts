import nodemailer, { SendMailOptions, Transporter } from "nodemailer";
import connectDB from "./mongodb";
import Setting from "../models/Setting";

async function getSiteSettings() {
  try {
    await connectDB();
    const settings = await Setting.findOne({ key: "site" });
    const footerSettings = await Setting.findOne({ key: "footer" });

    return {
      logo:
        settings?.value?.logo ||
        "https://res.cloudinary.com/qmgjj5vu/image/upload/v1785171001/imgi_17_1784304698500-homy-organic-logo-footer_rhv4bg.png",
      brandName: footerSettings?.value?.brandName || "Homy Organic",
      contactEmail:
        footerSettings?.value?.contact?.email || "info@homyorganic.com",
      contactPhone: footerSettings?.value?.contact?.phone || "+92302 3735860",
    };
  } catch (error) {
    return {
      logo: "https://res.cloudinary.com/dz8pr6lnt/image/upload/v1770379199/homyorganic_arywhj.png",
      brandName: "Homy Organic",
      contactEmail: "info@homyorganic.com",
      contactPhone: "+92302 3735860",
    };
  }
}

const GMAIL_USER = "Pakgreen1439@gmail.com";
const FROM_ADDRESS = "<no-reply@homyorganic.com>";

function getAppPassword(): string {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    throw new Error(
      "App_Password environment variable is missing for email sending",
    );
  }
  return password;
}

function createTransporter(): Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: getAppPassword(),
    },
  });
}

function formatPKR(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `PKR ${rounded.toLocaleString("en-US")}`;
}

async function wrapTemplate(params: {
  preheader: string;
  title: string;
  body: string;
}) {
  const { preheader, title, body } = params;
  const siteConfig = await getSiteSettings();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">
    <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff;">
            
            <!-- Header -->
            <tr>
              <td style="padding-bottom: 30px; border-bottom: 2px solid #f0f0f0; text-align: center;">
                <img src="${siteConfig.logo}" alt="${siteConfig.brandName}" style="max-height: 50px; width: auto; display: inline-block;" />
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="padding: 30px 0 20px 0;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000; text-align: center;">${title}</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="font-size: 16px; line-height: 1.6; color: #444444;">
                ${body}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding-top: 40px; margin-top: 40px; border-top: 1px solid #f0f0f0; font-size: 14px; color: #888888; text-align: center;">
                <p style="margin: 0 0 10px 0;">Need help? Reach out to us.</p>
                <p style="margin: 0;">
                  <a href="mailto:${siteConfig.contactEmail}" style="color: #000000; text-decoration: underline;">${siteConfig.contactEmail}</a> | 
                  <a href="tel:${siteConfig.contactPhone}" style="color: #000000; text-decoration: none;">${siteConfig.contactPhone}</a>
                </p>
                <p style="margin: 20px 0 0 0; font-size: 12px; color: #bbbbbb;">
                  &copy; ${new Date().getFullYear()} ${siteConfig.brandName}. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export async function sendEmail(options: SendMailOptions) {
  const transporter = createTransporter();
  const siteConfig = await getSiteSettings();

  const mailOptions: SendMailOptions = {
    from: `${siteConfig.brandName} ${FROM_ADDRESS}`,
    ...options,
  };

  return transporter.sendMail(mailOptions);
}

export async function buildWelcomeEmail(name: string) {
  const subject = "Welcome to Homy Organic";
  const siteConfig = await getSiteSettings();
  const safeName = name?.trim() || "there";

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px;">Hi ${safeName},</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Thanks for creating an account at ${siteConfig.brandName}. You can now browse products, save your favorites, and check out quickly.</p>
    <p style="margin: 0; font-size: 16px; line-height: 1.6;">If you have any questions, just reply to this email.</p>
  `;

  const html = await wrapTemplate({
    preheader: `Welcome to ${siteConfig.brandName}`,
    title: `Welcome to ${siteConfig.brandName}`,
    body,
  });

  return { subject, html };
}

export async function buildOrderEmail(params: {
  customerName?: string;
  orderId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalPrice: number;
  shippingAddress?: {
    fullName?: string;
    address?: string;
    city?: string;
    phone?: string;
  };
  paymentMethod?: string;
}) {
  const {
    customerName,
    orderId,
    orderItems,
    totalPrice,
    shippingAddress,
    paymentMethod,
  } = params;
  const siteConfig = await getSiteSettings();

  const attachmentImages = orderItems
    .filter((item) => Boolean(item.image))
    .map((item, index) => ({
      filename: `${item.name || "product"}-${index + 1}.jpg`,
      path: item.image as string,
    }));

  const itemsHtml = orderItems
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      const imageTag = item.image
        ? `<img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border: 1px solid #eeeeee;"/>`
        : "";

      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${imageTag}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eeeeee;">
            <p style="margin: 0; font-weight: 600; font-size: 14px;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #777777;">Qty: ${item.quantity}</p>
          </td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eeeeee;">
            <p style="margin: 0; font-weight: 600; font-size: 14px;">${formatPKR(itemTotal)}</p>
          </td>
        </tr>
      `;
    })
    .join("");

  const body = `
    <p style="margin: 0 0 20px 0;">Hi${customerName ? ` ${customerName}` : ""}, thank you for your order! We are currently processing it.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding-right: 20px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #888888; text-transform: uppercase;">Order ID</p>
          <p style="margin: 0; font-weight: 600; font-size: 15px;">${orderId}</p>
        </td>
        <td>
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #888888; text-transform: uppercase;">Payment</p>
          <p style="margin: 0; font-weight: 600; font-size: 15px;">${paymentMethod || "Cash on Delivery"}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding: 16px 8px 16px 0; text-align: right; font-weight: 400; font-size: 15px;">Total</td>
        <td style="padding: 16px 0; text-align: right; font-weight: 700; font-size: 18px;">${formatPKR(totalPrice)}</td>
      </tr>
    </table>

    <div style="border-top: 2px solid #000000; padding-top: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px; text-transform: uppercase;">Delivery Details</p>
      <p style="margin: 0 0 4px 0;">${shippingAddress?.fullName || ""}</p>
      <p style="margin: 0 0 4px 0;">${shippingAddress?.address || ""}</p>
      ${shippingAddress?.city ? `<p style="margin: 0 0 4px 0;">${shippingAddress.city}</p>` : ""}
      ${shippingAddress?.phone ? `<p style="margin: 0;">${shippingAddress.phone}</p>` : ""}
    </div>

    <p style="margin: 0; font-size: 14px;">Questions? Reply to this email or call us at ${siteConfig.contactPhone}.</p>
  `;

  const html = await wrapTemplate({
    preheader: `Your ${siteConfig.brandName} order is confirmed`,
    title: "Order Confirmed",
    body,
  });

  return {
    subject: `Your ${siteConfig.brandName} order is confirmed`,
    html,
    attachments: attachmentImages,
  };
}
