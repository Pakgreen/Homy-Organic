"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { signIn } from "next-auth/react";
import { FiArrowRight, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setStatusMessage({ type: "error", text: "Passwords do not match" });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 4) {
      setStatusMessage({
        type: "error",
        text: "Password must be at least 4 characters",
      });
      setIsLoading(false);
      return;
    }

    try {
      await axios.post("/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setStatusMessage({
        type: "success",
        text: "Account created! Signing you in...",
      });

      // Auto sign in
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.ok) {
        router.push("/");
        router.refresh();
      } else if (result?.error) {
        setStatusMessage({ type: "error", text: result.error });
      }
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to create account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col relative items-center justify-center bg-white px-4 py-2 min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-120px)]">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 p-2 cursor-pointer text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        aria-label="Go back"
      >
        <FiArrowLeft className="w-5 h-5" />
      </button>
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-4 sm:p-8 md:p-9">
          <div className="text-center mb-6 space-y-3 sm:space-y-3">
            <div className="flex justify-center ">
              <Image
                src="/homyorganic.png"
                alt="Homy Orgaic logo"
                width={72}
                height={72}
                className="rounded-full "
                priority
              />
            </div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.28em] text-gray-500">
              Join us
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Create account
            </h2>
          </div>

          {statusMessage && (
            <div
              className={`mb-4 text-sm text-center ${
                statusMessage.type === "error"
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
                placeholder="Enter Your Name"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input"
                placeholder="Enter Your Email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
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
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 cursor-pointer pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 cursor-pointer right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white text-lg sm:text-xl font-semibold py-3 sm:py-3.5 rounded-lg hover:bg-gray-900 transition disabled:opacity-60 cursor-pointer disabled:cursor-wait flex items-center justify-center gap-2"
            >
              {isLoading ? "Creating account..." : "Create account"}
              {isLoading ? (
                <span
                  className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/60 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <FiArrowRight size={18} />
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm sm:text-base text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-semibold text-gray-900 hover:text-black underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
