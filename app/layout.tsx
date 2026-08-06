import type { Metadata } from "next";
import { Jost, Syne } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooterAndSlider from "@/components/ConditionalFooterAndSlider";
import ConditionalMain from "@/components/ConditionalMain";
import ThemeProvider from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import SitePopup from "@/components/SitePopup";
import connectDB from "@/lib/mongodb";
import Setting from "@/models/Setting";
import Script from "next/script";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import TopProgressBar from "@/components/TopProgressBar";
import PagePreloader from "@/components/PagePreloader";
import WhatsAppWidget from "@/components/WhatsAppWidget";

// Disable Next.js caching across the app so every request fetches fresh data.
export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homyorganic.store";
const companyName = "Homy Organic";
const companyFullName = "Homy Organic Store";
const companyTagline =
  "Where Beauty Meets Wellness - Organic Products, Clothing & Premium Collection";
const companyDescription =
  "Homy Organic is your trusted destination for quality organic products, clothing, lawn suits, and wellness items in Pakistan.";
const logoPath = "/homyorganic.png";
const faviconPath = "/homyorganic.png";
const logoUrl = new URL(logoPath, siteUrl).toString();

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${companyName} | ${companyTagline}`,
    template: `%s | ${companyName}`,
  },
  description: companyDescription,
  keywords: [
    "homy organic",
    "homyorganic",
    "homy organic store",
    "organic products pakistan",
    "lawn suits pakistan",
    "ladies clothing",
    "men's fashion",
    "bacho k kapray",
    "online shopping pakistan",
    "featured products",
    "secure checkout",
  ],
  applicationName: companyName,
  authors: [{ name: companyName }],
  creator: companyName,
  publisher: companyName,
  category: "shopping",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: `${companyName} | ${companyTagline}`,
    description: companyDescription,
    url: siteUrl,
    siteName: companyName,
    images: [
      {
        url: logoUrl,
        width: 512,
        height: 512,
        alt: companyName,
      },
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${companyName} | ${companyTagline}`,
    description: companyDescription,
    images: [logoUrl],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/homyorganic.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/homyorganic.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let themeData = null;
  let siteSettings: any = null;
  try {
    const fetchLayoutData = async () => {
      await connectDB();
      const [themeDoc, siteDoc] = await Promise.all([
        Setting.findOne({ key: "theme_colors" }).lean(),
        Setting.findOne({ key: "site" }).lean(),
      ]);
      return {
        theme: themeDoc?.value || null,
        site: siteDoc?.value || null,
      };
    };

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 400)
    );

    const layoutData: any = await Promise.race([fetchLayoutData(), timeoutPromise]);
    if (layoutData) {
      themeData = layoutData.theme;
      siteSettings = layoutData.site;
    }
  } catch (error) {
    console.error("Failed to load layout theme & site settings", error);
  }

  const dynamicFavicon = siteSettings?.favicon || siteSettings?.logo || "/homyorganic.png";

  const primaryColor = themeData?.primaryColor || "#000000";
  const headingColor = themeData?.headingColor || "#000000";
  const textColor = themeData?.textColor || "#374151";
  const buttonBgColor = themeData?.buttonBgColor || "#000000";
  const buttonTextColor = themeData?.buttonTextColor || "#ffffff";
  const backgroundColor = themeData?.backgroundColor || "#ffffff";
  const footerBgColor = themeData?.footerBgColor || "#ffffff";
  const footerTextColor = themeData?.footerTextColor || "#374151";

  // WebSite Schema with SearchAction (Crucial for Google Sitelinks Searchbox)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: companyName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: companyFullName,
    alternateName: companyName,
    url: siteUrl,
    logo: logoUrl,
    sameAs: [],
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={dynamicFavicon} sizes="any" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href={dynamicFavicon} />
        <link rel="apple-touch-icon" href={dynamicFavicon} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:ital,wght@1,600&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --primary-color: ${primaryColor};
              --heading-color: ${headingColor};
              --text-color: ${textColor};
              --btn-bg: ${buttonBgColor};
              --btn-text: ${buttonTextColor};
              --background-color: ${backgroundColor};
              --footer-bg: ${footerBgColor};
              --footer-text: ${footerTextColor};
            }
          `,
          }}
        />
      </head>
      <body
        className={`${jost.className} ${syne.variable} overflow-x-hidden`}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <AuthProvider>
          <TopProgressBar />
          <ThemeProvider />
          <CartDrawer />
          <SitePopup />

          <div className="flex flex-col min-h-screen">
            <Navbar />
            <ConditionalMain>{children}</ConditionalMain>
            <ConditionalFooterAndSlider />
          </div>
          <BottomNav />
          <WhatsAppWidget />
        </AuthProvider>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
