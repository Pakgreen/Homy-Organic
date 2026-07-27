"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchString = searchParams?.toString();
    const url = pathname + (searchString ? `?${searchString}` : "");

    window.gtag?.("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}
``