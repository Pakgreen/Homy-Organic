"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import Sidebar from "./AdminSidebar";
import AdminTopNav from "./AdminTopNav";
import { Toaster } from "react-hot-toast";
import { canAccessAdminPanel } from "@/lib/rolePermissions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session?.user) {
      const canAccess = canAccessAdminPanel(session.user.role);
      if (!canAccess) {
        router.push("/");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "var(--primary-color, #000000)" }}
        ></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50 relative">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Static Top Nav — stays fixed, never scrolls */}
        <div className="hidden md:block">
          <AdminTopNav />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-4 flex items-center gap-2 mt-12 md:mt-0">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                title="Go back"
              >
                <FiArrowLeft size={16} strokeWidth={2.5} />
                Back
              </button>
            </div>

            <div className="pb-20">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
