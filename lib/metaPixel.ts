export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  "";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const pageview = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
};

// https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events
export const event = (name: string, options: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, options);
  }
};
