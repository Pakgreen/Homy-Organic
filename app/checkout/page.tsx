"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import axios from "axios";
import LocalImageUpload from "@/components/LocalImageUpload";
import { useSession } from "next-auth/react";
import { FiInfo, FiCheckCircle, FiX, FiDownload, FiCopy } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import CountryPhoneInput from "@/components/CountryPhoneInput";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+923000000000");
  const [siteLogo, setSiteLogo] = useState<string>("/homyorganic.png");
  const [storeContact, setStoreContact] = useState<{ phone: string; email: string }>({ phone: "", email: "" });
  const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<"both" | "cod" | "prepaid">("both");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [deliveryData, setDeliveryData] = useState<{
    enabled: boolean;
    amount: number;
  }>({ enabled: false, amount: 0 });
  const [selectedCountryCode, setSelectedCountryCode] = useState("+92");
  const [saveDetails, setSaveDetails] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    phone: "",
    paymentReference: "",
    paymentProofUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && !showSuccessPopup) {
      router.push("/cart");
    }
  }, [items, router, showSuccessPopup]);

  // Load saved details from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem("homy_saved_checkout_details");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.saveDetails === "boolean") {
          setSaveDetails(parsed.saveDetails);
        }
        setFormData((prev) => ({
          ...prev,
          fullName: parsed.fullName || prev.fullName,
          email: parsed.email || prev.email,
          address: parsed.address || prev.address,
          phone: parsed.phone || prev.phone,
        }));
        if (parsed.countryCode) {
          setSelectedCountryCode(parsed.countryCode);
        }
      }
    } catch (e) {
      console.error("Failed to load saved checkout details:", e);
    }
  }, []);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const res = await axios.get("/api/settings/site");
        if (res.data?.logo) {
          setSiteLogo(res.data.logo);
        }
        if (res.data?.contactPhone) {
          setStoreContact((prev) => ({ ...prev, phone: res.data.contactPhone }));
        }
        if (res.data?.contactEmail) {
          setStoreContact((prev) => ({ ...prev, email: res.data.contactEmail }));
        }
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
          setWhatsappNumber(res.data.whatsappNumber);
        }
        if (res.data?.allowedPaymentMethods) {
          const mode = res.data.allowedPaymentMethods as "both" | "cod" | "prepaid";
          setAllowedPaymentMethods(mode);
          if (mode === "prepaid") {
            setPaymentMethod("Prepaid");
          } else if (mode === "cod") {
            setPaymentMethod("Cash on Delivery");
          }
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

  // Comprehensive client-side validation to block invalid/malformed orders
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 1. Full Name Validation
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = "Full name is required";
    } else if (trimmedName.length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters long";
    }

    // 2. Email Format Validation
    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address (e.g. name@gmail.com)";
    }

    // 3. Address Validation
    const trimmedAddress = formData.address.trim();
    if (!trimmedAddress) {
      newErrors.address = "Delivery address is required";
    } else if (trimmedAddress.length < 10) {
      newErrors.address = "Please enter a complete delivery address (street, house no, city)";
    }

    // 4. Phone Number Validation (Pakistani & International Country Code)
    const rawPhone = formData.phone.trim();
    const cleanDigits = rawPhone.replace(/[^0-9]/g, "");

    if (!rawPhone) {
      newErrors.phone = "Phone number is required";
    } else if (selectedCountryCode === "+92") {
      const cleanPhone = rawPhone.replace(/[\s-]/g, "");
      const is03Format = /^03[0-9]{9}$/.test(cleanPhone);
      const is3Format = /^3[0-9]{9}$/.test(cleanPhone);
      const is923Format = /^923[0-9]{9}$/.test(cleanPhone);
      const isPlus923Format = /^\+923[0-9]{9}$/.test(cleanPhone);

      if (!is03Format && !is3Format && !is923Format && !isPlus923Format) {
        newErrors.phone =
          "Invalid Pakistani phone number! Must be 11 digits starting with 03 (e.g. 0300 1234567 or +923001234567)";
      }
    } else {
      if (cleanDigits.length < 6 || cleanDigits.length > 15) {
        newErrors.phone = `Please enter a valid phone number for ${selectedCountryCode} (6-15 digits)`;
      }
    }

    // 5. Prepaid Payment Verification
    if (paymentMethod === "Prepaid") {
      const reference = formData.paymentReference.trim();
      if (!reference) {
        newErrors.paymentReference = "Transaction ID / Reference is required";
      } else if (reference.length < 5) {
        newErrors.paymentReference = "Please enter a valid Transaction ID (at least 5 characters)";
      }

      if (!formData.paymentProofUrl) {
        newErrors.paymentProofUrl = "Please upload payment screenshot proof";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
          name: item.size ? `${item.name} (${item.size})` : item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          size: item.size,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          address: formData.address,
          phone: formData.phone.startsWith("+")
            ? formData.phone
            : `${selectedCountryCode} ${formData.phone.replace(/^0/, "")}`,
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

      if (saveDetails) {
        try {
          localStorage.setItem(
            "homy_saved_checkout_details",
            JSON.stringify({
              saveDetails: true,
              fullName: formData.fullName,
              email: formData.email,
              address: formData.address,
              phone: formData.phone,
              countryCode: selectedCountryCode,
            })
          );
        } catch (e) {
          console.error("Failed to save checkout details:", e);
        }
      } else {
        try {
          localStorage.removeItem("homy_saved_checkout_details");
        } catch (e) {}
      }

      toast.success("Order placed successfully!");
      setPlacedOrder(res.data);
      setPlacedOrderId(res.data._id || res.data.id);
      clearCart();
      setShowSuccessPopup(true);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message || "Failed to place order";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdfSlip = () => {
    const orderDataToPrint = placedOrder || {
      _id: placedOrderId,
      createdAt: new Date().toISOString(),
      shippingAddress: {
        fullName: formData.fullName,
        address: formData.address,
        phone: formData.phone,
      },
      contactEmail: formData.email,
      paymentMethod,
      orderItems: items,
      itemsPrice: subtotal,
      shippingPrice: deliveryPrice,
      totalPrice: total,
    };

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download/print slip");
      return;
    }

    const itemsListHtml = (orderDataToPrint.orderItems || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${
                item.image
                  ? `<img src="${item.image.startsWith("http") ? item.image : window.location.origin + item.image}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; flex-shrink: 0;" />`
                  : ""
              }
              <div>
                <div style="font-weight: 600; color: #111827; font-size: 13px;">${item.name || "Item"}</div>
                ${item.size ? `<div style="font-size: 11px; color: #6b7280; font-weight: 500;">Size: ${item.size}</div>` : ""}
              </div>
            </div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: 600; font-size: 13px;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; font-size: 13px;">PKR ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const logoSrc = siteLogo ? (siteLogo.startsWith("http") ? siteLogo : window.location.origin + siteLogo) : "";

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Receipt Slip - ${orderDataToPrint._id || "Invoice"}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #1f2937; max-width: 600px; margin: 0 auto; line-height: 1.5; background: #fff; }
            .top-bar { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #B9853A; margin-bottom: 20px; }
            .brand-left { text-align: left; }
            .logo-img { max-height: 52px; max-width: 200px; object-fit: contain; display: block; margin-bottom: 4px; }
            .logo-text { font-size: 24px; font-weight: 800; color: #B9853A; letter-spacing: 1.5px; text-transform: uppercase; }
            .store-info { font-size: 11px; color: #4b5563; margin-top: 4px; line-height: 1.4; }
            .title-right { text-align: right; }
            .receipt-heading { font-size: 18px; font-weight: 800; color: #111827; letter-spacing: 1px; text-transform: uppercase; }
            .order-id { font-family: monospace; font-size: 12px; font-weight: 700; color: #B9853A; margin-top: 2px; }
            .order-date { font-size: 11px; color: #6b7280; margin-top: 2px; }

            .details-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f9fafb; padding: 14px; border-radius: 10px; border: 1px solid #f3f4f6; font-size: 12px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 2px; }
            .val { font-weight: 600; color: #111827; }

            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th { background: #F8F5EE; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .items-table td { padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 12px; vertical-align: middle; }

            .summary-card { width: 220px; margin-left: auto; background: #F8F5EE; padding: 12px 14px; border-radius: 10px; border: 1px solid #EFEAE0; font-size: 12px; }
            .summary-row { display: flex; justify-content: space-between; padding: 3px 0; color: #4b5563; }
            .summary-total { display: flex; justify-content: space-between; padding-top: 6px; margin-top: 6px; border-top: 1px dashed #d1d5db; font-weight: 800; font-size: 14px; color: #111827; }

            .footer-note { margin-top: 28px; padding-top: 14px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #6b7280; }
            .footer-contact { font-weight: 600; color: #B9853A; margin-top: 3px; }

            @media print {
              body { padding: 0; }
              @page { size: auto; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="top-bar">
            <div class="brand-left">
              ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="Homy Organic" />` : `<div class="logo-text">Homy Organic</div>`}
              <div class="store-info">
                ${storeContact.phone ? `<div><strong>Phone/WhatsApp:</strong> ${storeContact.phone}</div>` : `<div><strong>WhatsApp:</strong> ${whatsappNumber}</div>`}
                ${storeContact.email ? `<div><strong>Email:</strong> ${storeContact.email}</div>` : ""}
              </div>
            </div>
            <div class="title-right">
              <div class="receipt-heading">ORDER RECEIPT</div>
              <div class="order-id">#${orderDataToPrint._id || "N/A"}</div>
              <div class="order-date">Date: ${new Date(orderDataToPrint.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="details-box">
            <div>
              <div class="label">Customer Information</div>
              <div class="val">${orderDataToPrint.shippingAddress?.fullName || formData.fullName || "Customer"}</div>
              <div style="color: #4b5563;">Phone: ${orderDataToPrint.shippingAddress?.phone || formData.phone}</div>
              <div style="color: #4b5563;">Email: ${orderDataToPrint.contactEmail || formData.email}</div>
            </div>
            <div>
              <div class="label">Shipping & Payment</div>
              <div class="val">Method: ${orderDataToPrint.paymentMethod || paymentMethod}</div>
              <div style="color: #4b5563; margin-top: 3px;">Address: ${orderDataToPrint.shippingAddress?.address || formData.address}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <div class="summary-card">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>PKR ${(orderDataToPrint.itemsPrice || subtotal).toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span>Delivery Charge</span>
              <span>${(orderDataToPrint.shippingPrice || deliveryPrice) === 0 ? "Free" : "PKR " + (orderDataToPrint.shippingPrice || deliveryPrice).toLocaleString()}</span>
            </div>
            <div class="summary-total">
              <span>Total Payable</span>
              <span style="color: #B9853A;">PKR ${(orderDataToPrint.totalPrice || total).toLocaleString()}</span>
            </div>
          </div>

          <div class="footer-note">
            <div>Thank you for your order with Homy Organic!</div>
            <div class="footer-contact">Contact Us: ${storeContact.phone || whatsappNumber} | info@homyorganic.com</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
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
            {allowedPaymentMethods === "cod"
              ? "Cash on Delivery Available"
              : allowedPaymentMethods === "prepaid"
              ? "Prepay via Bank Transfer / EasyPaisa / JazzCash"
              : "Choose Cash on Delivery or prepay via Bank Transfer."}
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
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        errors.fullName
                          ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                          : "border-gray-200 bg-gray-50 text-black focus:border-[#B9853B] focus:bg-white focus:ring-1 focus:ring-[#B9853B] focus:outline-none"
                      }`}
                      placeholder="Ahmad"
                    />
                    {errors.fullName && (
                      <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                        <span>•</span> {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        errors.email
                          ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                          : "border-gray-200 bg-gray-50 text-black focus:border-[#B9853B] focus:bg-white focus:ring-1 focus:ring-[#B9853B] focus:outline-none"
                      }`}
                      placeholder="ahmad@gmail.com"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                        <span>•</span> {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all resize-none ${
                      errors.address
                        ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        : "border-gray-200 bg-gray-50 text-black focus:border-[#B9853B] focus:bg-white focus:ring-1 focus:ring-[#B9853B] focus:outline-none"
                    }`}
                    placeholder="House / Street No, Area, City"
                    rows={2}
                  />
                  {errors.address && (
                    <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                      <span>•</span> {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Phone Number *
                  </label>
                  <CountryPhoneInput
                    value={formData.phone}
                    countryCode={selectedCountryCode}
                    onCountryCodeChange={(code) => {
                      setSelectedCountryCode(code);
                      if (errors.phone) handleInputChange("phone", formData.phone);
                    }}
                    onPhoneChange={(val) => handleInputChange("phone", val)}
                    error={errors.phone}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group select-none bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300 transition-all">
                    <input
                      type="checkbox"
                      checked={saveDetails}
                      onChange={(e) => setSaveDetails(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-gray-300 text-[#B9853A] focus:ring-[#B9853A] cursor-pointer accent-[#B9853A]"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1">
                      <span className="text-xs font-semibold text-gray-800 group-hover:text-black transition-colors">
                        Save my information for future orders
                      </span>
                      <span className="text-[11px] text-gray-500 font-urdu" dir="rtl">
                        مستقبل کے آرڈرز کے لیے معلومات محفوظ کریں
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-8">
                  <h3 className="text-sm uppercase tracking-widest text-black font-bold mb-6">
                    Payment Method
                  </h3>

                  <div className="flex flex-col gap-4">
                    {/* COD Option */}
                    {(allowedPaymentMethods === "both" || allowedPaymentMethods === "cod") && (
                      <div
                        onClick={() => setPaymentMethod("Cash on Delivery")}
                        className={`border rounded-lg p-5 cursor-pointer transition-all ${
                          paymentMethod === "Cash on Delivery"
                            ? "border-[#B9853B] ring-1 ring-[#B9853B] bg-amber-50/30"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              paymentMethod === "Cash on Delivery"
                                ? "border-[#B9853B]"
                                : "border-gray-300"
                            }`}
                          >
                            {paymentMethod === "Cash on Delivery" && (
                              <div className="w-2 h-2 bg-[#B9853B] rounded-full" />
                            )}
                          </div>
                          <span className="font-bold text-sm tracking-wide text-gray-900">
                            Cash on Delivery
                          </span>
                        </div>

                        {paymentMethod === "Cash on Delivery" && (
                          <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-col gap-2 text-sm text-gray-600 font-medium">
                              <div className="flex items-center gap-1.5 text-[#B9853B] font-bold text-[11px] uppercase tracking-widest mb-1">
                                <FiInfo className="w-3.5 h-3.5" />
                                <span>Instruction / ضروری ہدایت</span>
                              </div>
                              <span className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                                You can pay in cash to our courier when you
                                receive the parcel at your doorstep.{" "}
                                <span className="text-black font-bold inline-block mt-0.5 bg-amber-100/60 px-1 py-0.5 rounded">
                                  (First Receive Parcel, Then Pay)
                                </span>
                              </span>
                              <span
                                className="font-urdu text-sm sm:text-base text-gray-900 leading-relaxed border-t border-gray-200 pt-2 mt-1"
                                dir="rtl"
                              >
                                پارسل وصول کرتے وقت آپ ہمارے کوریئر کو نقد رقم
                                (Cash) ادا کر سکتے ہیں۔{" "}
                                <span className="font-bold bg-amber-100/60 px-1 py-0.5 rounded">
                                  (سامان ملنے کے بعد پیسے دیں)
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prepaid Option */}
                    {(allowedPaymentMethods === "both" || allowedPaymentMethods === "prepaid") && (
                      <div
                        onClick={() => setPaymentMethod("Prepaid")}
                        className={`border rounded-lg p-5 cursor-pointer transition-all ${
                          paymentMethod === "Prepaid"
                            ? "border-[#B9853B] ring-1 ring-[#B9853B] bg-amber-50/30"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              paymentMethod === "Prepaid"
                                ? "border-[#B9853B]"
                                : "border-gray-300"
                            }`}
                          >
                            {paymentMethod === "Prepaid" && (
                              <div className="w-2 h-2 bg-[#B9853B] rounded-full" />
                            )}
                          </div>
                          <span className="font-bold text-sm tracking-wide text-gray-900">
                            Prepaid Transfer
                          </span>
                        </div>

                        {paymentMethod === "Prepaid" && (
                          <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-col gap-2 text-sm text-gray-600 font-medium mb-6">
                              <div className="flex items-center gap-1.5 text-[#B9853B] font-bold text-[11px] uppercase tracking-widest mb-1">
                                <FiInfo className="w-3.5 h-3.5" />
                                <span>Important / انتہائی اہم</span>
                              </div>
                              <span className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                                Please transfer the total amount in advance to
                                confirm your order. After sending the payment,
                                attach the screenshot and transaction ID below.{" "}
                                <span className="text-black font-bold inline-block mt-0.5 bg-amber-100/60 px-1 py-0.5 rounded">
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
                                    handleInputChange("paymentReference", e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                                    errors.paymentReference
                                      ? "border-red-500 bg-red-50/20 text-red-900 focus:border-red-600"
                                      : "border-gray-200 bg-white text-black focus:border-[#B9853B] focus:ring-1 focus:ring-[#B9853B] focus:outline-none"
                                  }`}
                                  placeholder="TXN123456789"
                                />
                                {errors.paymentReference && (
                                  <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                                    <span>•</span> {errors.paymentReference}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
                                  Payment Screenshot *
                                </label>
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={`border border-dashed p-1 transition-colors rounded-lg bg-white ${
                                    errors.paymentProofUrl
                                      ? "border-red-500 bg-red-50/20"
                                      : "border-gray-300 hover:border-[#B9853B]"
                                  }`}
                                >
                                  <LocalImageUpload
                                    value={formData.paymentProofUrl}
                                    onChange={(url) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        paymentProofUrl: url,
                                      }));
                                      if (errors.paymentProofUrl) {
                                        setErrors((prev) => ({
                                          ...prev,
                                          paymentProofUrl: "",
                                        }));
                                      }
                                    }}
                                    onRemove={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        paymentProofUrl: "",
                                      }))
                                    }
                                  />
                                </div>
                                {errors.paymentProofUrl && (
                                  <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                                    <span>•</span> {errors.paymentProofUrl}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#B9853B] hover:bg-[#9a6d2f] text-white text-xs tracking-[0.2em] font-bold uppercase py-4 sm:py-5 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 cursor-pointer rounded-xl flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing Order...
                      </span>
                    ) : (
                      "Complete Order"
                    )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-2xl p-5 shadow-lg border border-gray-100 my-auto animate-in zoom-in-95 duration-250">
            {/* Close Button */}
            <button
              onClick={() => router.push("/")}
              className="absolute top-3.5 right-3.5 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Close"
            >
              <FiX className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-3.5 text-center">
              {/* Header with Modern Blue Verified Tick */}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <div className="inline-flex items-center gap-1.5  px-3.5 py-1 rounded-full text-xs font-bold border border-blue-100 shadow-2xs">
                  <FiCheckCircle className="w-4 h-4 text-[#000000] stroke-[2.5]" />
                  <span>Order Confirmed</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight mt-0.5">
                  Thank You for Your Order!
                </h3>
                
              </div>

              {/* Minimal Order Info Box */}
              <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100 text-xs text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Order ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-gray-900">#{placedOrderId}</span>
                    <button
                      onClick={() => {
                        if (placedOrderId) {
                          navigator.clipboard.writeText(placedOrderId);
                          toast.success("Copied!");
                        }
                      }}
                      className="text-gray-400 hover:text-[#1D9BF0] transition-colors p-0.5"
                      title="Copy ID"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Customer:</span>
                  <span className="font-semibold text-gray-800 line-clamp-1">
                    {placedOrder?.shippingAddress?.fullName || formData.fullName}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                  <span className="text-gray-500 font-medium">Total Amount:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {formatPrice(placedOrder?.totalPrice || total)}
                  </span>
                </div>
              </div>

              {/* Compact Small Action Buttons Row (choty button) */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hi Homy Organic, I just placed an order!\nOrder ID: #${placedOrderId}\nTotal Amount: ${formatPrice(
                        placedOrder?.totalPrice || total
                      )}\nName: ${placedOrder?.shippingAddress?.fullName || formData.fullName}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#128C7E] active:scale-[0.98] text-white py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    <FaWhatsapp className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={handleDownloadPdfSlip}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#B9853B] hover:bg-[#9a6d2f] active:scale-[0.98] text-white py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    <span>Download Slip</span>
                  </button>
                </div>

                <button
                  onClick={() => router.push("/")}
                  className="w-full py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
