"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Trigger loading finish when pathname or searchParams change
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept click on internal links to show instant top progress loader
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");

      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        target.getAttribute("target") !== "_blank"
      ) {
        const currentPath = window.location.pathname;
        if (href !== currentPath) {
          setLoading(true);
          setProgress(25);

          const interval = setInterval(() => {
            setProgress((prev) => (prev < 85 ? prev + 15 : prev));
          }, 100);

          setTimeout(() => clearInterval(interval), 3000);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none transition-opacity duration-300"
      style={{ opacity: loading || progress > 0 ? 1 : 0 }}
    >
      <div
        className="h-full bg-gray-400 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(156,163,175,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
