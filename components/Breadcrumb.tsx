"use client";

import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homyorganic.store";

  const allItems = [
    { name: "Home", url: "/" },
    ...items,
  ];

  const schemaList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaList),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-2 text-xs text-gray-500 py-3 px-4 sm:px-0 overflow-x-auto"
      >
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <FiHome className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <div key={idx} className="flex items-center space-x-2 shrink-0">
              <FiChevronRight className="w-3 h-3 text-gray-400" />
              {isLast ? (
                <span className="font-semibold text-gray-900 line-clamp-1 max-w-[200px]">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-gray-900 transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
