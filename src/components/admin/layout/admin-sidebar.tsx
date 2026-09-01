"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  Store,
  Palette,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Layers,
  Ticket,
  TrendingUp,
  Headphones,
  Settings,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "User Accounts", href: "/admin/users", icon: Users },
  { label: "Stores & Domains", href: "/admin/stores", icon: Store },
  { label: "Growth Quests", href: "/admin/growth-quests", icon: Target, badge: "Rebuilt" },
  { label: "Theme Templates", href: "/admin/templates", icon: Palette },
  { label: "Creative Services", href: "/admin/creative", icon: Sparkles, badge: "New" },
  { label: "Catalog Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Payments & Revenue", href: "/admin/payments", icon: CreditCard },
  { label: "SaaS Plans", href: "/admin/plans", icon: Layers },
  { label: "Promo Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Platform Analytics", href: "/admin/analytics", icon: TrendingUp },
  { label: "Support Queue", href: "/admin/support", icon: Headphones },
  { label: "System Settings", href: "/admin/settings", icon: Settings },
];

export interface AdminSidebarProps {
  onNavigate?: () => void;
  hideCollapseButton?: boolean;
}

export function AdminSidebar({ onNavigate, hideCollapseButton = false }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative z-30 h-screen bg-[#080808] border-r border-white/10 flex flex-col justify-between transition-all duration-300 font-body select-none shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Header & Logo */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/50 flex items-center justify-center text-white shrink-0 shadow-glow">
              <ShieldAlert className="w-4 h-4 text-maroon-300" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-xs font-bold font-heading text-white tracking-tight block">
                  SUPER ADMIN
                </span>
                <span className="text-[10px] text-maroon-400 font-mono block">Platform Control</span>
              </div>
            )}
          </Link>

          {!hideCollapseButton && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative",
                  isActive
                    ? "bg-maroon-950/80 text-white font-semibold border border-maroon-600/40 shadow-glow"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-maroon-300" : "text-zinc-500 group-hover:text-zinc-200")} />
                {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                {!collapsed && item.badge && (
                  <Badge variant="maroon" className="text-[9px] px-1.5 py-0 font-mono">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Badge */}
      {!collapsed && (
        <div className="p-4 border-t border-white/10 font-mono text-[11px] text-zinc-500">
          Platform Version 2.4.0 • <span className="text-emerald-400">Optimal</span>
        </div>
      )}
    </aside>
  );
}
