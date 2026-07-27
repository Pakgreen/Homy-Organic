"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiFacebook, FiTwitter, FiInstagram, FiMail } from "react-icons/fi";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Footer() {
  const pathname = usePathname();
  const [footerData, setFooterData] = useState({
    brandName: "Homy Orgaic",
    tagline: "Modern essentials crafted for everyday elegance.",
    contact: {
      email: "info@Homy Oraganic.store",
      phone: "+92 336 8249118",
      address: "Multan, Pakistan",
    },
    socials: {
      facebook: "https://facebook.com/homyorganics",
      twitter: "https://twitter.com/homyorganic",
      instagram: "https://instagram.com/homyorganic",
    },
    links: [{ label: "Shop", url: "/products" }],
  });
  const [siteLogo, setSiteLogo] = useState("/homyorganic.png");
  const [loaded, setLoaded] = useState(false);

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
    pathname?.startsWith("/search")
  ) {
    return null;
  }

  // Optionally return null or skeleton while loading to avoid hydration mismatch
  if (!loaded) return null;

  return (
    <footer className=" hidden md:block mx-3 sm:mx-6 lg:mx-8 mb-3 overflow-hidden rounded-4xl bg-white text-gray-700 border border-gray-100 shadow-[0_-12px_40px_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
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
            <p className="text-gray-500 mt-13 text-sm leading-relaxed">
              {footerData.tagline}
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base text-gray-900">Explore</h4>
            <ul className="space-y-2 text-sm">
              {(footerData.links || []).map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.url}
                    className="hover:text-black transition-colors block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
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

          {/* Social */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base text-gray-900">Follow</h4>
            <div className="flex space-x-3 text-gray-500">
              {footerData.socials.facebook && (
                <a
                  href={footerData.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="p-2 rounded-full border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  <FiFacebook size={18} />
                </a>
              )}
              {footerData.socials.twitter && (
                <a
                  href={footerData.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="p-2 rounded-full border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  <FiTwitter size={18} />
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
                  <FiInstagram size={18} />
                </a>
              )}
              {footerData.contact.email && (
                <a
                  href={`mailto:${footerData.contact.email}`}
                  aria-label="Email"
                  className="p-2 rounded-full border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  <FiMail size={18} />
                </a>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              New drops and offers straight to your inbox.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-10 pt-6 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} {footerData.brandName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
