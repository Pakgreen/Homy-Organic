import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Authentication | Homy Organic",
  description: "Sign in or create an account on Homy Organic Store.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
