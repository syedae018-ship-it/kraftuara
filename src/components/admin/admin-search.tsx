"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search, Users, Store, ArrowRight, Loader2 } from "lucide-react";
import { adminRepository } from "@/lib/repositories/admin-repository";

export function AdminSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<{ type: string; name: string; sub: string; href: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([
      adminRepository.getUsers().catch(() => []),
      adminRepository.getStores().catch(() => []),
    ])
      .then(([users, stores]) => {
        if (!isMounted) return;
        const list: { type: string; name: string; sub: string; href: string }[] = [];

        for (const u of users) {
          list.push({
            type: "Merchant",
            name: u.name || "Merchant User",
            sub: u.email || "",
            href: "/admin/users",
          });
        }

        for (const s of stores) {
          list.push({
            type: "Store",
            name: s.name,
            sub: s.slug ? `${s.slug}.kraftaura.in` : "",
            href: "/admin/stores",
          });
        }

        setItems(list);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const filtered = items.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4 font-body">
        <Input
          placeholder="Search real platform merchants and storefronts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
          autoFocus
        />

        {loading ? (
          <div className="py-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-maroon-400" /> Loading platform records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            {query.trim() ? "No matching merchants or stores found." : "No platform records available."}
          </div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filtered.slice(0, 15).map((res, i) => (
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
        )}
      </div>
    </Modal>
  );
}
