"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { BreadcrumbItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { ImpersonationBanner } from "./impersonation-banner";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full bg-[#080808] text-white flex flex-col font-body antialiased overflow-hidden">
      <ImpersonationBanner />
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* Desktop Sidebar (Stationary left edge, full viewport height) */}
        <div className="hidden lg:flex flex-col h-full shrink-0 z-30">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-[280px] h-full"
              >
                <Sidebar collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Workspace Independent Scroll Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
          <Navbar
            breadcrumbs={breadcrumbs}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
