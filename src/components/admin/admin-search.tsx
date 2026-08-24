"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search, Users, Store, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";

export function AdminSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  const mockResults = [
    { type: "User", name: "Syed Mustafa", sub: "syed@aroma.com", href: "/admin/users" },
    { type: "Store", name: "Aroma Perfumes", sub: "aroma-perfumes.platform.com", href: "/admin/stores" },
    { type: "Creative Order", name: "CRV-9081 - Eid Banners", sub: "In Production", href: "/admin/creative" },
    { type: "Support Ticket", name: "TCK-801 - Custom Domain DNS", sub: "High Priority", href: "/admin/support" },
  ].filter(
    (r) =>
      !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.sub.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4 font-body">
        <Input
          placeholder="Global Search Users, Stores, Creative Orders, Tickets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
          autoFocus
        />

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {mockResults.map((res, i) => (
            <Link
              key={i}
              href={res.href}
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-maroon-950/60 border border-maroon-800/40 text-[10px] font-mono text-maroon-300 font-bold uppercase">
                  {res.type}
                </span>
                <div>
                  <h5 className="font-bold font-heading text-white group-hover:text-maroon-300 transition-colors">
                    {res.name}
                  </h5>
                  <span className="text-[10px] text-zinc-500 font-mono">{res.sub}</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </Modal>
  );
}
