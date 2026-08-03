import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account Profile | Homy Organic",
  description: "Manage your profile and account settings on Homy Organic Store.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
