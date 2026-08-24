"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminNavbar } from "./admin-navbar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex overflow-hidden font-body selection:bg-maroon-800 selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-[280px] h-full"
            >
              <AdminSidebar
                onNavigate={() => setMobileMenuOpen(false)}
                hideCollapseButton={true}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminNavbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className={cn("p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 flex-1", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
