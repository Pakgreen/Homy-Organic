"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowRight, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";

export default function AdminSignInPage() {
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      console.log("[LOGIN] Attempting signin with:", {
        email: formData.email,
        loginType: "admin",
      });

      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        loginType: "admin",
      });

      console.log("[LOGIN] SignIn result:", result);

      if (result?.ok) {
        setStatusMessage({
          type: "success",
          text: "Admin securely signed in! Redirecting...",
        });
        // Wait a bit longer to ensure session is updated, then redirect
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 1500);
      } else if (result?.error) {
        console.error("[LOGIN] SignIn error:", result.error);
        setStatusMessage({ type: "error", text: result.error });
      }
    } catch (error: any) {
      console.error("[LOGIN] Exception:", error);
      setStatusMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-[#EEF3EC] h-screen w-full flex-col md:flex-row overflow-hidden">
      {/* Left Side - Brand Display (Fixed background style) */}
      <div className="relative w-full md:w-2/5  text-white p-8 md:p-12 flex flex-col justify-between hidden md:flex h-full">
        {/* Subtle gradient overlay/background */}
        <div className="absolute inset-0 bg-[#B9853A]  pointer-events-none  rounded-r-full overflow-hidden"></div>

        <div className="relative z-10 flex items-center justify-start">
          <button
            onClick={() => router.push("/")}
            className="p-2 text-black hover:text-black cursor-pointer bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
            title="Return to Home"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex justify-center  rounded-full p-2 mb-6">
            <Image
              src="/homyorganic.png"
              alt="Homy Orgaic logo"
              width={72}
              height={72}
            
              priority
            />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            Admin Portal
          </h2>
          <p className="text-black text-base leading-relaxed max-w-md">
            Log in to manage your store, track active sessions, oversee users,
            and control contents cleanly securely.
          </p>
        </div>

        <div className="relative z-10 text-sm text-black font-medium tracking-wide text-center">
          © {new Date().getFullYear()} Homy Orgaic
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-3/5 p-6 sm:p-10 md:p-16 lg:p-24 flex flex-col justify-center h-full overflow-y-auto">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between mb-10 w-full max-w-md mx-auto">
          <button
            onClick={() => router.push("/")}
            className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
            title="Return to Home"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex justify-center  p-1 ">
            <Image
              src="/homyorganic.png"
              alt="Homy Orgaic logo"
              width={40}
              height={40}
  
              priority
            />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Please enter your admin credentials to continue.
            </p>
          </div>

          {statusMessage ? (
            <div
              className={`mb-6 p-4 text-sm ${
                statusMessage.type === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900"
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
                className="w-full px-0 py-2 border-b border-gray-300 bg-transparent focus:border-black outline-none transition-colors duration-200 placeholder-gray-400 text-gray-900"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-0 py-2 border-b border-gray-300 bg-transparent focus:border-black outline-none transition-colors duration-200 pr-10 placeholder-gray-400 text-gray-900"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center text-gray-400 hover:text-black focus:outline-none transition-colors"
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
              className="w-full mt-8 bg-black text-white font-medium py-3 hover:bg-gray-800 transition-colors duration-200 disabled:opacity-60 cursor-pointer disabled:cursor-wait flex items-center justify-center gap-2"
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
