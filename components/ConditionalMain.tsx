"use client";

import { usePathname } from "next/navigation";

export default function ConditionalMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/auth");

  // Admin and auth pages handle their own layout — no padding needed
  if (isAdminPage || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <main className="grow pb-16 md:pb-0">{children}</main>
  );
}
