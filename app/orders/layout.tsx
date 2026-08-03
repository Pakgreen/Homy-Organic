import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | Homy Organic",
  description: "View your order history and tracking status on Homy Organic Store.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
