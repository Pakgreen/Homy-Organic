"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifySuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/auth/signin");
    }, 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-2xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
        <p className="text-gray-600">
          Your email has been verified successfully. Redirecting you to sign
          in...
        </p>
        <button
          onClick={() => router.push("/auth/signin")}
          className="btn btn-primary w-full"
        >
          Go to sign in
        </button>
      </div>
    </div>
  );
}
