"use client";

import { useCms } from "@/context/CmsContext";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Loader from "@/components/common/Loader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, hydrated } = useCms();
  const { isExpanded, isHovered } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!currentUser) {
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role-based protection for routes
    const superAdminOnlyPaths = ["/equipe", "/parametres", "/demandes", "/dashboard", "/stages", "/tracking"];
    const isRestricted = superAdminOnlyPaths.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    );

    if (isRestricted && currentUser.role !== "super_admin") {
      router.replace("/articles");
    }
  }, [currentUser, hydrated, pathname, router]);

  // On mobile (<lg): sidebar is hidden (translate-x-full), content = full width, no margin
  // On desktop (lg+): sidebar is always visible, content offset by sidebar width
  const mainContentMargin = isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  if (!hydrated || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader />
        <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          Chargement du CMS...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar — fixed, hidden on mobile until toggled */}
      <AppSidebar />
      {/* Overlay backdrop for mobile sidebar */}
      <Backdrop />

      {/* Main content — always full width on mobile, offset by sidebar on desktop */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Sticky Header */}
        <AppHeader />
        {/* Page Content */}
        <main className="flex-1 p-4 mx-auto w-full max-w-screen-2xl md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
