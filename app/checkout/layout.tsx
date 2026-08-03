import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Homy Organic",
  description: "Complete your secure order on Homy Organic Store.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
