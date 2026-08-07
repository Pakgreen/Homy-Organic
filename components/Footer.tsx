"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiFacebook, FiInstagram, FiMail, FiSend, FiCheckCircle, FiAward, FiShield } from "react-icons/fi";
import { FaTiktok } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export default function Footer() {
  const pathname = usePathname();
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [footerData, setFooterData] = useState<any>({
    brandName: "Homy Organic",
    tagline: "Where Beauty Meets Wellness",
    contact: {
      email: "info@homyorganic.com",
      phone: "+92302 3735860",
      address: "Multan, Pakistan",
    },
    socials: {
      facebook: "https://facebook.com/homyorganicspk",
      tiktok: "https://tiktok.com/@homyorganicpk",
      instagram: "https://instagram.com/homyorganicpk",
    },
    links: [
      { label: "Shop All", url: "/products" },
      { label: "Track Order", url: "/track-order" },
      { label: "About Us", url: "/about" },
      { label: "Contact Us", url: "/contact" },
      { label: "Shipping Policy", url: "/shipping-policy" },
      { label: "Return & Exchange", url: "/return-policy" },
      { label: "Privacy Policy", url: "/privacy-policy" },
    ],
  });
  const [siteLogo, setSiteLogo] = useState("/homyorganic.png");
  const [loaded, setLoaded] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubscribing(true);
    try {
      const res = await axios.post("/api/newsletter", { email: subscribeEmail });
      toast.success(res.data.message || "Subscribed successfully!");
      setSubscribeEmail("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to subscribe. Please try again."
      );
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const { data } = await axios.get("/api/settings/footer");
        if (data && data.brandName) {
          setFooterData(data);
        }
      } catch (error) {
        console.error("Failed to load footer settings", error);
      } finally {
        setLoaded(true);
      }
    };

    const fetchSiteLogo = async () => {
      try {
        const { data } = await axios.get("/api/settings/site");
        if (data && data.logo) {
          setSiteLogo(data.logo);
        }
      } catch (error) {
        console.error("Failed to load site logo", error);
      }
    };

    fetchFooterData();
    fetchSiteLogo();
  }, []);

  if (
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/search") ||
    pathname?.startsWith("/checkout")
  ) {
    return null;
  }

  // Optionally return null or skeleton while loading to avoid hydration mismatch
  if (!loaded) return null;

  return (
    <div className="mx-3 sm:mx-6 lg:mx-8 mb-20 sm:mb-6 space-y-8 sm:space-y-12">
      {/* Feature Highlights Section (No Icon BG, Modern Clean Typography) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {/* Feature 1: Premium Quality */}
          <div className="group flex flex-col items-center text-center">
            <div className="text-[#B9853B] mb-2 group-hover:scale-110 transition-transform duration-300">
              <FiAward size={38} />
            </div>
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900">
              Premium Quality
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto mt-1">
              No compromise on quality, ever.
            </p>
          </div>

          {/* Feature 2: 100% Organic & Pure */}
          <div className="group flex flex-col items-center text-center">
            <div className="text-[#B9853B] mb-2 group-hover:scale-110 transition-transform duration-300">
              <FiCheckCircle size={38} />
            </div>
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900">
              100% Organic & Pure
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto mt-1">
              Pure, natural ingredients only.
            </p>
          </div>

          {/* Feature 3: Hand-Blended In Small Batches */}
          <div className="group flex flex-col items-center text-center">
            <div className="text-[#B9853B] mb-2 group-hover:scale-110 transition-transform duration-300">
              <FiShield size={38} />
            </div>
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900">
              Hand-Blended In Small Batches
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto mt-1">
              Crafted fresh for freshness & potency.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <footer className="overflow-hidden rounded-3xl sm:rounded-4xl bg-white text-gray-700 border border-gray-100 shadow-[0_-12px_40px_rgba(15,23,42,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 -mt-2">
              <Image
                src={siteLogo}
                alt={footerData.brandName}
                width={140}
                height={38}
                priority
                sizes="140px"
                style={{ height: "auto", width: "auto" }}
              />
            </div>
            <p className="text-gray-800 text-sm font-semibold tracking-wide uppercase">
              {footerData.tagline}
            </p>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-light">
              All our products are carefully hand-blended in small batches to
              ensure maximum freshness, quality, and effectiveness.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base text-gray-900">Our Policies</h4>
            <ul className="space-y-2 text-sm">
             {(footerData.links || []).map(
  (link: { label: string; url: string }, index: number) => (
    <li key={index}>
      <Link
        href={link.url}
        className="hover:text-black transition-colors block py-0.5"
      >
        {link.label}
      </Link>
    </li>
  )
)}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4 text-sm">
            <h4 className="font-semibold text-base text-gray-900">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${footerData.contact.email}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {footerData.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${footerData.contact.phone}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {footerData.contact.phone}
                </a>
              </li>
              <li className="text-gray-500">{footerData.contact.address}</li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base text-gray-900">Newsletter</h4>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
              Subscribe to receive exclusive offers, new drops, and organic care tips.
            </p>

            <form onSubmit={handleSubscribe} className="relative flex items-center mt-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-full border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all bg-gray-50/50"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="absolute right-1.5 w-8.5 h-8.5 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-900 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                title="Subscribe"
              >
                <FiSend size={14} className="text-white" style={{ color: "#ffffff" }} />
              </button>
            </form>

            <div className="pt-2">
              <div className="flex space-x-2.5 text-gray-500">
                {footerData.socials.facebook && (
                  <a
                    href={footerData.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="p-2 rounded-full border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-colors"
                  >
                    <FiFacebook size={16} />
                  </a>
                )}
                {(footerData.socials.tiktok || footerData.socials.twitter) && (
                  <a
                    href={footerData.socials.tiktok || footerData.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="p-2 rounded-full border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-colors"
                  >
                    <FaTiktok size={15} />
                  </a>
                )}
                {footerData.socials.instagram && (
                  <a
                    href={footerData.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="p-2 rounded-full border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-colors"
                  >
                    <FiInstagram size={16} />
                  </a>
                )}
                {footerData.contact.email && (
                  <a
                    href={`mailto:${footerData.contact.email}`}
                    aria-label="Email"
                    className="p-2 rounded-full border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-colors"
                  >
                    <FiMail size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-10 pt-6 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} {footerData.brandName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
);
}
