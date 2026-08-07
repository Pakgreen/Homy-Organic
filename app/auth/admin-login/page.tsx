"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowRight, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import { canAccessAdminPanel } from "@/lib/rolePermissions";

export default function AdminSignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (canAccessAdminPanel(session.user.role)) {
        router.replace("/admin");
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        loginType: "admin",
      });

      if (result?.ok) {
        setStatusMessage({
          type: "success",
          text: "Admin securely signed in! Redirecting...",
        });
        router.replace("/admin");
        router.refresh();
      } else if (result?.error) {
        setStatusMessage({ type: "error", text: result.error });
      }
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while session is checking or redirecting
  if (status === "loading" || (status === "authenticated" && canAccessAdminPanel(session?.user?.role))) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EEF3EC]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin rounded-full h-9 w-9 border-b-2"
            style={{ borderColor: "#B9853A" }}
          />
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Checking Admin Credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#EEF3EC] min-h-screen w-full flex-col md:flex-row overflow-x-hidden">
      
      {/* Left Side - Brand Panel: Sharp top/left, FULL rounded right edge */}
      <div className="relative w-full md:w-2/5 bg-[#B9853A] text-white p-6 sm:p-8 md:p-12 flex flex-col justify-between min-h-[240px] md:min-h-screen shrink-0 rounded-t-none rounded-b-[36px] md:rounded-b-none md:rounded-tl-none md:rounded-bl-none md:rounded-r-full shadow-none">
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="p-2 text-black hover:text-gray-900 cursor-pointer bg-white/20 hover:bg-white/40 rounded-full transition-all backdrop-blur-sm"
            title="Return to Home"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <span className="md:hidden text-xs font-semibold uppercase tracking-wider text-black">
            Admin Portal
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center my-4 md:my-auto">
          <div className="flex justify-center p-2 mb-4">
            <Image
              src="/homyorganic.png"
              alt="Homy Organic logo"
              width={72}
              height={72}
              priority
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight text-black font-serif">
            Admin Portal
          </h2>
          <p className="text-black text-xs sm:text-sm leading-relaxed max-w-md font-medium">
            Log in to manage your store, track active sessions, oversee users, and control content securely.
          </p>
        </div>

        <div className="relative z-10 text-xs text-black font-medium tracking-wide text-center hidden md:block">
          &copy; {new Date().getFullYear()} Homy Organic
        </div>
      </div>

      {/* Right Side - Form inside a Clean White Card with NO SHADOW */}
      <div className="w-full md:w-3/5 p-4 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center min-h-[calc(100vh-240px)] md:min-h-screen">
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-none">
          
          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-gray-500 mt-2 text-xs sm:text-sm font-light">
              Please enter your admin credentials to continue.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs sm:text-sm font-medium ${
                statusMessage.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-green-50 text-green-700 border border-green-100"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-0 py-2.5 border-b border-gray-300 bg-transparent focus:border-black outline-none transition-colors duration-200 placeholder-gray-400 text-gray-900 text-sm font-normal"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-0 py-2.5 border-b border-gray-300 bg-transparent focus:border-black outline-none transition-colors duration-200 pr-10 placeholder-gray-400 text-gray-900 text-sm font-normal"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center text-gray-400 hover:text-black focus:outline-none transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-[#B9853A] hover:bg-[#a3722e] text-white font-bold py-3.5 px-6 rounded-full transition-colors duration-200 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 text-sm tracking-wider uppercase shadow-none"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
              {isLoading ? (
                <span
                  className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <FiArrowRight size={16} />
              )}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
