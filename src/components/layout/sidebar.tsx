"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Grid,
  Sparkles,
  ShoppingBag,
  BarChart3,
  Palette,
  Megaphone,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Store,
  PlusCircle,
  Check,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, DummyStore } from "@/context/auth-context";

import { hasFeatureAccess, FeatureKey } from "@/lib/feature-gating";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: FeatureKey;
  badge?: string | number;
  requiredPlan?: "Pro" | "Business";
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigationSections: NavSection[] = [
  {
    title: "Core Platform",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard, feature: "dashboard" },
      { title: "Products", href: "/dashboard/products", icon: Package, feature: "products" },
      { title: "Categories", href: "/dashboard/categories", icon: Grid, feature: "categories" },
      { title: "Collections", href: "/dashboard/collections", icon: Grid, feature: "collections", requiredPlan: "Pro" },
      { title: "Creative Hub", href: "/dashboard/creative", icon: Sparkles, feature: "creative_discounts" },
      { title: "Orders", href: "/dashboard/orders", icon: ShoppingBag, feature: "orders", requiredPlan: "Business" },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3, feature: "analytics", requiredPlan: "Pro" },
    ],
  },
  {
    title: "Customization & Growth",
    items: [
      { title: "Appearance", href: "/dashboard/appearance", icon: Palette, feature: "appearance" },
      { title: "Themes", href: "/dashboard/themes", icon: Palette, feature: "premium_themes", requiredPlan: "Pro" },
      { title: "Settings", href: "/dashboard/settings", icon: Settings, feature: "store_settings" },
      { title: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },
      { title: "Support", href: "/dashboard/support", icon: HelpCircle },
    ],
  },
];


export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({ collapsed = false, onToggleCollapse, className }: SidebarProps) {
  const pathname = usePathname();
  const { user, activeStore, stores, switchStore, logout } = useAuth();
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#111111] border-r border-white/10 h-screen transition-all duration-300 ease-in-out select-none z-30 shrink-0",
        collapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* Header / Tenant Store Switcher */}
      <div className="p-4 border-b border-white/10 relative">
        <button
          onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
          className={cn(
            "w-full flex items-center justify-between p-2 rounded-xl bg-[#151515] border border-white/10 hover:border-white/20 transition-all text-left group",
            collapsed && "justify-center p-2.5"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Store className="w-4 h-4 text-white" />
            </div>
             {!collapsed && (
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold font-heading text-white truncate">
                  {activeStore?.name || "No Store Active"}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-zinc-400 font-body uppercase tracking-wider">
                    {activeStore?.plan || "Starter Plan"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform shrink-0" />
          )}
        </button>

        {/* Tenant Dropdown */}
        <AnimatePresence>
          {tenantDropdownOpen && !collapsed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-4 right-4 top-16 bg-[#151515] border border-white/10 rounded-xl p-2 shadow-2xl z-50 space-y-1 backdrop-blur-xl"
            >
              <div className="px-2 py-1 text-[10px] uppercase font-semibold tracking-wider text-zinc-500 font-heading">
                Your Catalog Stores
              </div>
              {stores.map((tenant: DummyStore) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    switchStore(tenant.id);
                    setTenantDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors text-left font-body"
                >
                  <div className="font-medium text-white">{tenant.name}</div>
                  {activeStore?.id === tenant.id && (
                    <Check className="w-3.5 h-3.5 text-maroon-400" />
                  )}
                </button>
              ))}
              <div className="border-t border-white/10 pt-1 mt-1">
                <a
                  href="/create-store"
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-maroon-400 hover:bg-maroon-950/40 transition-colors font-medium font-body"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create New Store
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation List - Dynamic Feature Gated Sections */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.feature) return true;
            return hasFeatureAccess(activeStore?.plan || "Starter Plan", item.feature);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-heading">
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium font-body transition-all duration-150 group",
                      isActive
                        ? "text-white bg-maroon-950/60 border border-maroon-700/40 shadow-glow"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-maroon-400" : "text-zinc-400 group-hover:text-white"
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono",
                          isActive
                            ? "bg-maroon-800 text-white"
                            : "bg-white/10 text-zinc-300"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle & User Profile Footer */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-maroon-900/60 border border-maroon-700/50 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold font-heading text-white truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-zinc-500 font-body truncate">{user?.email || ""}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => logout()}
            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors border border-transparent hover:border-red-900/40"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10",
              collapsed && "w-full flex justify-center"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
