"use client";

import { Search, Bell, ShieldCheck, User, Menu } from "lucide-react";
import { AdminSearch } from "../admin-search";
import { NotificationPanel } from "../notification-panel";

export interface AdminNavbarProps {
  onOpenMobileMenu?: () => void;
}

export function AdminNavbar({ onOpenMobileMenu }: AdminNavbarProps = {}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-white/10 bg-[#080808]/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 font-body gap-4">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Global Search Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#111111] border border-white/10 hover:border-white/20 text-xs text-zinc-400 font-body transition-all max-w-sm w-full"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="truncate">Global Search Users, Stores, Orders...</span>
          <kbd className="ml-auto font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 hidden sm:inline-block">⌘K</kbd>
        </button>

        {/* Right Admin Profile & Notifications */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] font-mono text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> System Status: Optimal
          </div>

          <button
            onClick={() => setNotificationsOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10 relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-maroon-500" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/50 flex items-center justify-center text-white font-bold font-heading text-xs shadow-glow">
              SA
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold font-heading text-white block leading-none">Super Administrator</span>
              <span className="text-[10px] text-zinc-500 font-mono">owner@platform.com</span>
            </div>
          </div>
        </div>
      </header>

      <AdminSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
