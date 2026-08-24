"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, Check, Store, ChevronDown, Sparkles } from "lucide-react";
import { useAuth, DummyStore } from "@/context/auth-context";
import { Badge } from "@/components/ui/table";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, activeStore, stores, switchStore, logout } = useAuth();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white text-xs font-semibold font-heading shadow-sm overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.charAt(0) || "U"
          )}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold font-heading text-white truncate max-w-[120px]">
            {user?.name || "User"}
          </span>
          <span className="text-[10px] text-maroon-400 font-body uppercase tracking-wider font-semibold">
            {user?.plan || "Starter Plan"}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform hidden sm:block" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-40" />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-64 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-2 backdrop-blur-xl space-y-2"
            >
              {/* User Profile Header */}
              <div className="p-3 bg-[#111111] rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold font-heading text-white">{user?.name || "User"}</p>
                  <Badge variant="maroon" className="text-[9px] py-0 px-1.5">
                    {user?.plan || "Starter Plan"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-400 font-body truncate">{user?.email || ""}</p>
              </div>

              {/* Store Switcher Options */}
              <div className="space-y-1 pt-1">
                <div className="px-2.5 text-[10px] font-bold font-heading uppercase tracking-widest text-zinc-500">
                  Switch Store
                </div>
                {stores.map((s: DummyStore) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      switchStore(s.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors text-left font-body"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-white font-medium">{s.name}</span>
                    </div>
                    {activeStore?.id === s.id && (
                      <Check className="w-3.5 h-3.5 text-maroon-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Action Links */}
              <div className="border-t border-white/10 pt-1 space-y-0.5">
                <a
                  href="/dashboard/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-body"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  Account Settings
                </a>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/40 transition-colors font-body"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
