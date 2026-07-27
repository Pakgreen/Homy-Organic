"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const router = useRouter();
  const openCart = useCartStore((state) => state.openCart);

  useEffect(() => {
    openCart();
    router.replace("/");
  }, [openCart, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading cart...</div>
    </div>
  );
}
