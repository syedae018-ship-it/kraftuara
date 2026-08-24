"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Command, Package, ShoppingBag, Sparkles, Settings, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

const searchShortcuts = [
  { title: "Products Catalog", desc: "View and manage catalog items", icon: Package, href: "/dashboard/products" },
  { title: "Store Orders", desc: "View incoming customer orders", icon: ShoppingBag, href: "/dashboard/orders" },
  { title: "Creative Hub", desc: "Order promotional banners and designs", icon: Sparkles, href: "/dashboard/creative-hub" },
  { title: "Store Settings", desc: "Configure domain, tax, and branding", icon: Settings, href: "/dashboard/settings" },
];

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filtered = searchShortcuts.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#111111] border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-all group"
      >
        <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
        <span className="hidden md:inline font-body">Search platform...</span>
        <span className="hidden md:flex items-center gap-0.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-zinc-400 border border-white/5">
          <Command className="w-2.5 h-2.5" /> K
        </span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search products, orders, settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
            autoFocus
          />

          <div className="space-y-1">
            <div className="text-[10px] font-bold font-heading uppercase tracking-widest text-zinc-500 px-1 pb-1">
              Quick Shortcuts
            </div>
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group text-left border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-maroon-400 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold font-heading text-white">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400 font-body">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                </a>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
