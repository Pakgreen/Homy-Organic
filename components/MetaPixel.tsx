"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import axios from "axios";
import * as pixel from "@/lib/metaPixel";

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pixelId, setPixelId] = useState<string>(pixel.FB_PIXEL_ID);

  useEffect(() => {
    // If not in ENV, try to fetch from site settings API
    const fetchPixelId = async () => {
      if (!pixelId) {
        try {
          const res = await axios.get("/api/settings/site");
          if (res.data?.metaPixelId) {
            setPixelId(res.data.metaPixelId);
          }
        } catch (e) {
          // ignore error
        }
      }
    };
    fetchPixelId();
  }, [pixelId]);

  useEffect(() => {
    if (pixelId) {
      pixel.pageview();
    }
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt="meta-pixel"
        />
      </noscript>
    </>
  );
}
