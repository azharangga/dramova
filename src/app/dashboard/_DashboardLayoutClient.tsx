"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

function InnerDashboardLayout({ children }: DashboardLayoutClientProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useAdmin();

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "superuser"))) {
      if (!user) {
        router.replace("/login?next=/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [user, isLoading, router]);

  if (!isLoading && (!user || user.role !== "superuser")) return null;

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#fcfbf8] dark:bg-[#0f0f10] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Desktop Sidebar - Static */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              aria-label="Close sidebar"
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-2xl"
            >
              <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header - Static */}
        <DashboardHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto relative px-4 pt-5 pb-12 sm:px-6 sm:pt-6 sm:pb-14 lg:px-10 lg:pt-8 lg:pb-16 min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161618] px-4 sm:px-6 py-3 text-xs text-zinc-500 dark:text-zinc-400 shrink-0 select-none">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 max-w-7xl mx-auto">
            <p className="font-semibold text-zinc-600 dark:text-zinc-400">
              {t("footerCopyright", "© 2026 Dramova. All rights reserved.")}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              {t("footerMadeBy", "Dibuat oleh Azharangga Kusuma.")}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  return (
    <AdminProvider>
      <InnerDashboardLayout>{children}</InnerDashboardLayout>
    </AdminProvider>
  );
}
