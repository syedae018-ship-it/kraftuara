"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, ChevronRight, Plus, Package, Grid, Sparkles } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { SearchBar } from "@/components/dashboard/search-bar";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  onOpenMobileMenu?: () => void;
  className?: string;
}

export function Navbar({
  breadcrumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }],
  onOpenMobileMenu,
  className,
}: NavbarProps) {
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-16 w-full border-b border-white/10 bg-[#080808]/80 backdrop-blur-md px-3.5 sm:px-6 lg:px-8 flex items-center justify-between transition-all",
        className
      )}
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden w-11 h-11 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10 flex items-center justify-center shrink-0"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs font-body">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
                {isLast || !item.href ? (
                  <span className="font-semibold text-white font-heading tracking-wide">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search, Create Action, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <SearchBar />

        {/* Quick "+ Create" Action Dropdown */}
        <div className="relative hidden md:block">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create
          </Button>

          <AnimatePresence>
            {createDropdownOpen && (
              <>
                <div onClick={() => setCreateDropdownOpen(false)} className="fixed inset-0 z-40" />

                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 z-50 w-52 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1.5 backdrop-blur-xl space-y-1"
                >
                  <Link
                    href="/dashboard/products"
                    onClick={() => setCreateDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-body"
                  >
                    <Package className="w-3.5 h-3.5 text-maroon-400" />
                    Add Product
                  </Link>
                  <Link
                    href="/dashboard/categories"
                    onClick={() => setCreateDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-body"
                  >
                    <Grid className="w-3.5 h-3.5 text-maroon-400" />
                    Create Category
                  </Link>
                  <Link
                    href="/dashboard/creative"
                    onClick={() => setCreateDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-body"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Order Creative Banner
                  </Link>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
