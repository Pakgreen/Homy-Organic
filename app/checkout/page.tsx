"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import axios from "axios";
import LocalImageUpload from "@/components/LocalImageUpload";
import { useSession } from "next-auth/react";
import { FiInfo, FiCheckCircle, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+923000000000"); // Add your own number or fetch it
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [deliveryData, setDeliveryData] = useState<{
    enabled: boolean;
    amount: number;
  }>({ enabled: false, amount: 0 });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    phone: "",
    paymentReference: "",
    paymentProofUrl: "",
  });

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && !showSuccessPopup) {
      router.push("/cart");
    }
  }, [items, router, showSuccessPopup]);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const res = await axios.get("/api/settings/site");
        if (res.data?.paymentAccountDetails) {
          setPaymentDetails(res.data.paymentAccountDetails);
        }
        if (res.data?.deliveryChargesEnabled) {
          setDeliveryData({
            enabled: true,
            amount: res.data.deliveryChargeAmount || 0,
          });
        }
        if (res.data?.whatsappNumber) {
          setWhatsappNumber(res.data.whatsappNumber); // Optional if available but using default if not. Default is set above.
        }
      } catch (error) {
        console.error("Site settings fetch error:", error);
      }
    };

    const fetchFooterSettings = async () => {
      try {
        const res = await axios.get("/api/settings/footer");
        if (res.data?.contact?.phone) {
          setWhatsappNumber(res.data.contact.phone);
        }
      } catch (error) {
        console.error("Footer settings fetch error:", error);
      }
    };

    fetchSiteSettings();
    fetchFooterSettings();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/user/profile");
        const profile = res.data || {};
        const addr = profile.address || {};
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.state,
          addr.zipCode,
          addr.country,
        ]
          .filter(Boolean)
          .join(", ");

        setFormData((prev) => ({
          ...prev,
          fullName: profile.name || prev.fullName,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          address: formattedAddress || prev.address,
        }));
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };

    fetchProfile();
  }, [session]);

  useEffect(() => {
    if (showSuccessPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showSuccessPopup]);

  const subtotal = getTotalPrice();

  const deliveryPrice = deliveryData.enabled ? deliveryData.amount : 0;
  const total = subtotal + deliveryPrice;

  // Basic client-side validation to block malformed orders
  const validateForm = () => {
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      toast.error("Full name is required");
      return false;
    }
    if (trimmedName.length < 3) {
      toast.error("Full name must be at least 3 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!formData.address.trim()) {
      toast.error("Delivery address is required");
      return false;
    }
    if (formData.address.trim().length < 10) {
      toast.error("Please enter a complete delivery address");
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    const digitsOnlyPhone = formData.phone.replace(/[^0-9]/g, "");
    if (digitsOnlyPhone.length < 10 || digitsOnlyPhone.length > 15) {
      toast.error("Please enter a valid phone number (10-15 digits)");
      return false;
    }

    if (paymentMethod === "Prepaid") {
      const reference = formData.paymentReference.trim();
      if (!reference) {
        toast.error("Payment reference/Transaction ID is required");
        return false;
      }
      if (reference.length < 5) {
        toast.error("Please enter a valid Transaction ID");
        return false;
      }

      if (!formData.paymentProofUrl) {
        toast.error("Please upload the payment screenshot");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate cart items aren't empty
      if (!items || items.length === 0) {
        toast.error("Your cart is empty");
        setIsSubmitting(false);
        return;
      }

      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      const orderData = {
        orderItems: items.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          address: formData.address,
          phone: formData.phone,
          city: "",
        },
        contactEmail: formData.email,
        paymentMethod,
        paymentReference: formData.paymentReference,
        paymentProofUrl: formData.paymentProofUrl,
        itemsPrice: subtotal,
        shippingPrice: deliveryPrice,
        taxPrice: 0,
        totalPrice: total,
      };

      const res = await axios.post("/api/orders", orderData);
      toast.success("Order placed successfully!");
      clearCart();
      setPlacedOrderId(res.data._id);
      setShowSuccessPopup(true);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message || "Failed to place order";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || (items.length === 0 && !showSuccessPopup)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-2 mb-10">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
            Checkout
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-2">
            Confirm your order
          </h1>
          <p className="text-sm text-gray-700 font-medium mb-1">
            Review your details and place your order.
          </p>
          <p className="text-[11px] uppercase tracking-widest text-black font-bold border-b border-gray-200 pb-6">
            Choose Cash on Delivery or prepay via Bank Transfer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <div className="border-t border-gray-900 bg-white pt-8">
              <h2 className="text-sm uppercase tracking-widest text-black font-bold mb-8">
                Delivery Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-black focus:border-black focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all placeholder:font-light placeholder:text-gray-400"
                      placeholder="Ahmad"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-black focus:border-black focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all placeholder:font-light placeholder:text-gray-400"
                      placeholder="ahmad@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-black focus:border-black focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all resize-none placeholder:font-light placeholder:text-gray-400"
                    placeholder="Street, City, State, Zip"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-black focus:border-black focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all placeholder:font-light placeholder:text-gray-400"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="pt-8">
                  <h3 className="text-sm uppercase tracking-widest text-black font-bold mb-6">
                    Payment Method
                  </h3>

                  <div className="flex flex-col gap-4">
                    {/* COD Option */}
                    <div
                      onClick={() => setPaymentMethod("Cash on Delivery")}
                      className={`border rounded-lg p-5 cursor-pointer transition-all ${
                        paymentMethod === "Cash on Delivery"
                          ? "border-black ring-1 ring-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            paymentMethod === "Cash on Delivery"
                              ? "border-black"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === "Cash on Delivery" && (
                            <div className="w-2 h-2 bg-black rounded-full" />
                          )}
                        </div>
                        <span className="font-bold text-sm tracking-wide text-gray-900">
                          Cash on Delivery
                        </span>
                      </div>

                      {paymentMethod === "Cash on Delivery" && (
                        <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2">
                          <div className="flex flex-col gap-2 text-sm text-gray-600 font-medium">
                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-[11px] uppercase tracking-widest mb-1">
                              <FiInfo className="w-3.5 h-3.5" />
                              <span>Instruction / ضروری ہدایت</span>
                            </div>
                            <span className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                              You can pay in cash to our courier when you
                              receive the parcel at your doorstep.{" "}
                              <span className="text-black font-bold inline-block mt-0.5 bg-orange-100/50 px-1 py-0.5 rounded">
                                (First Receive Parcel, Then Pay)
                              </span>
                            </span>
                            <span
                              className="font-urdu text-sm sm:text-base text-gray-900 leading-relaxed border-t border-gray-200 pt-2 mt-1"
                              dir="rtl"
                            >
                              پارسل وصول کرتے وقت آپ ہمارے کوریئر کو نقد رقم
                              (Cash) ادا کر سکتے ہیں۔{" "}
                              <span className="font-bold bg-orange-100/50 px-1 py-0.5 rounded">
                                (سامان ملنے کے بعد پیسے دیں)
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prepaid Option */}
                    <div
                      onClick={() => setPaymentMethod("Prepaid")}
                      className={`border rounded-lg p-5 cursor-pointer transition-all ${
                        paymentMethod === "Prepaid"
                          ? "border-black ring-1 ring-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            paymentMethod === "Prepaid"
                              ? "border-black"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === "Prepaid" && (
                            <div className="w-2 h-2 bg-black rounded-full" />
                          )}
                        </div>
                        <span className="font-bold text-sm tracking-wide text-gray-900">
                          Prepaid Transfer
                        </span>
                      </div>

                      {paymentMethod === "Prepaid" && (
                        <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2">
                          <div className="flex flex-col gap-2 text-sm text-gray-600 font-medium mb-6">
                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-[11px] uppercase tracking-widest mb-1">
                              <FiInfo className="w-3.5 h-3.5" />
                              <span>Important / انتہائی اہم</span>
                            </div>
                            <span className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                              Please transfer the total amount in advance to
                              confirm your order. After sending the payment,
                              attach the screenshot and transaction ID below.{" "}
                              <span className="text-black font-bold inline-block mt-0.5 bg-orange-100/50 px-1 py-0.5 rounded">
                                (Pay First, Then Receive Parcel)
                              </span>
                            </span>
                            <span
                              className="font-urdu text-sm sm:text-base text-gray-900 leading-relaxed border-t border-gray-200 pt-2 mt-1"
                              dir="rtl"
                            >
                              براہ کرم اپنا آرڈر کنفرم کرنے کے لیے کل رقم پہلے
                              ٹرانسفر کریں۔ ادائیگی کے بعد اسکرین شاٹ اور
                              ٹرانزیکشن آئی ڈی نیچے درج کریں۔{" "}
                              <span className="font-bold bg-orange-100/50 px-1 py-0.5 rounded">
                                (پہلے پیسے دیں، پھر سامان ملے گا)
                              </span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                                Transaction ID *
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.paymentReference}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    paymentReference: e.target.value,
                                  })
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-black focus:border-black focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all placeholder:font-light placeholder:text-gray-400"
                                placeholder="TXN123456789"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
                                Payment Screenshot *
                              </label>
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="border border-dashed border-gray-300 p-1 hover:border-black transition-colors rounded-lg bg-white"
                              >
                                <LocalImageUpload
                                  value={formData.paymentProofUrl}
                                  onChange={(url) =>
                                    setFormData({
                                      ...formData,
                                      paymentProofUrl: url,
                                    })
                                  }
                                  onRemove={() =>
                                    setFormData({
                                      ...formData,
                                      paymentProofUrl: "",
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white text-xs tracking-[0.2em] font-bold uppercase py-5 hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? "Processing..." : "Complete Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="border-t border-gray-900 bg-white pt-8 sticky top-6">
              <h2 className="text-sm uppercase tracking-widest text-black font-bold mb-8">
                Order Summary
              </h2>

              <div className="space-y-6 mb-10">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between items-start text-sm group"
                  >
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        <div className="w-16 h-20 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                              No IMG
                            </span>
                          )}
                        </div>
                        <span className="absolute -top-2 -right-2 bg-white text-black border border-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col pt-1">
                        <span className="text-gray-900 font-bold uppercase tracking-wider text-xs leading-relaxed max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-gray-500 pt-1 text-xs">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="flex justify-between text-xs uppercase tracking-widest text-gray-500 font-bold">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-widest text-gray-500 font-bold">
                    <span>Delivery</span>
                    <span className="text-gray-900 font-medium">
                      {deliveryPrice === 0
                        ? "Complimentary"
                        : formatPrice(deliveryPrice)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-900 pt-6 flex justify-between items-end">
                  <span className="text-sm font-bold text-black uppercase tracking-widest">
                    Total
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-black">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <div className="bg-white border text-center border-gray-100 p-6">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3 font-bold">
                  Instructions
                </p>
                {paymentMethod === "Prepaid" ? (
                  <div className="space-y-4">
                    <div className="text-[11px] font-medium leading-relaxed max-w-[280px] mx-auto space-y-4">
                      <p className="text-gray-500">
                        Transfer the exact amount to the account below, then
                        enter the Transaction ID and upload your screenshot{" "}
                        <span className="hidden lg:inline font-bold text-black">
                          on the left.
                        </span>
                        <span className="inline lg:hidden font-bold text-black">
                          below.
                        </span>
                      </p>
                      <div className="flex bg-gray-50 border border-gray-200 p-3 rounded-xl gap-3 text-right">
                        <p
                          className="text-black font-urdu font-bold leading-loose text-sm flex-1 pr-1"
                          dir="rtl"
                        >
                          نیچے دیئے گئے اکاؤنٹ میں درست رقم منتقل کریں، پھر
                          ٹرانزیکشن آئی ڈی درج کریں اور اپنا رسید کا اسکرین شاٹ{" "}
                          <span className="hidden lg:inline underline decoration-gray-300 underline-offset-4">
                            بائیں جانب
                          </span>
                          <span className="inline lg:hidden underline decoration-gray-300 underline-offset-4">
                            نیچے
                          </span>{" "}
                          اپ لوڈ کریں۔
                        </p>
                        <div className="shrink-0 pt-1 text-black">
                          <FiInfo size={16} className="text-black" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs text-black whitespace-pre-wrap font-bold leading-relaxed mx-auto text-left">
                        {paymentDetails || "No payment details configured yet."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 font-medium max-w-[220px] mx-auto leading-relaxed">
                    Have exact change ready. Delivery partner will contact you
                    upon arrival.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/95 backdrop-blur-md animate-in fade-in duration-500">
          <button
            onClick={() => router.push("/")}
            className="absolute top-6 right-6 p-2 cursor-pointer text-gray-500 hover:text-black transition-colors"
          >
            <FiX className="w-8 h-8" strokeWidth={1.5} />
          </button>

          <div className="max-w-sm w-full flex flex-col items-center text-center animate-in slide-in-from-bottom-8 duration-700">
            <FiCheckCircle
              className="w-16 h-16 text-black mb-6"
              strokeWidth={1}
            />

            <h3 className="text-2xl font-bold text-black mb-3 tracking-tight">
              Order Confirmed
            </h3>
            <p className="text-sm text-gray-500 mb-10 leading-relaxed max-w-[260px]">
              Your order has been placed successfully. Thank you for shopping
              with us.
            </p>

            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi, I just placed an order! My Order ID is: " + placedOrderId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[280px] flex flex-col items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <FaWhatsapp className="w-5 h-5" />
                <span className="text-sm tracking-wide">WhatsApp Us</span>
              </div>
              <span
                className="font-urdu text-xs font-normal opacity-90"
                dir="rtl"
              >
                نمائندے سے رابطہ کریں
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
