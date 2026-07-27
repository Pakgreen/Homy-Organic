"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiX, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { isCloudinaryUrl } from "@/lib/image";

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    getTotalPrice,
    isOpen,
    closeCart,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed  inset-0 bg-black/50 z-999999 transition-opacity cursor-pointer"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-999999 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Your Cart</h2>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <FiTrash2 className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Your cart is empty
                </p>
                <p className="text-gray-500 mt-1">
                  Looks like you haven't added any items yet.
                </p>
              </div>
              <button onClick={closeCart} className="btn btn-primary mt-4">
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item._id} className="flex gap-4">
                  <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={item.image || "/placeholder.jpg"}
                      alt={item.name}
                      fill
                      sizes="80px"
                      unoptimized={isCloudinaryUrl(item.image)}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="mt-auto flex items-center border border-gray-200 rounded-md w-fit">
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1)
                        }
                        className="px-2.5 py-1 text-gray-500 hover:text-gray-900 disabled:opacity-50 cursor-pointer"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="px-2 text-sm font-medium w-8 text-center cursor-default">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1)
                        }
                        className="px-2.5 py-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 sm:p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-gray-900">
                Subtotal
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Shipping and taxes calculated at checkout.
            </p>
            <button
              onClick={() => {
                closeCart();
                router.push("/checkout");
              }}
              className="w-full btn btn-primary py-3 hover:opacity-90"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
