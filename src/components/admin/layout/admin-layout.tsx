"use client";

import React from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminNavbar } from "./admin-navbar";
import { cn } from "@/lib/utils";

export interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex overflow-hidden font-body selection:bg-maroon-800 selection:text-white">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminNavbar />
        <main className={cn("p-6 max-w-7xl w-full mx-auto space-y-6 flex-1", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
