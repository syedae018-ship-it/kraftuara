"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreData } from "@/lib/repositories/storefront-repository";
import { Mail, Phone, MapPin, Instagram, Facebook, MessageSquare } from "lucide-react";
import { getStoreBasePath } from "@/lib/urls";

export function StoreFooter({ store, isSubdomain = false }: { store: StoreData, isSubdomain?: boolean }) {
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo");
  const demoTheme = pathname?.split("/")[2] || "luxury";
  const storePrefix = getStoreBasePath(store.slug, isSubdomain, isDemo, demoTheme);

  const { branding } = store.appearance;

  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-12 pb-8 px-4 lg:px-8 font-body text-xs text-zinc-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
        <div className="space-y-3 md:col-span-2">
          <h4 className="text-base font-bold font-heading text-white">{store.name}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            {branding.description || "Luxury agarwood perfumes and concentrated attars delivered directly to your doorstep."}
          </p>
        </div>

        <div className="space-y-2">
          <h5 className="font-bold font-heading text-white uppercase tracking-wider text-[11px]">Store Sections</h5>
          <ul className="space-y-1 text-zinc-400">
            <li><Link href={storePrefix} className="hover:text-white transition-colors">Catalog Home</Link></li>
            <li><Link href={`${storePrefix}#products`} className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link href={`${storePrefix}#collections`} className="hover:text-white transition-colors">Curated Collections</Link></li>
          </ul>
        </div>

        <div className="space-y-2">
          <h5 className="font-bold font-heading text-white uppercase tracking-wider text-[11px]">Contact & Social</h5>
          <ul className="space-y-1.5 text-zinc-400">
            {branding.email && <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-maroon-400" /> {branding.email}</li>}
            {branding.phone && <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-maroon-400" /> {branding.phone}</li>}
            {branding.instagram && <li className="flex items-center gap-2"><Instagram className="w-3.5 h-3.5 text-maroon-400" /> {branding.instagram}</li>}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <span>© {new Date().getFullYear()} {store.name}. Powered by Catalog SaaS.</span>
        <span className="text-[11px] text-zinc-500 font-mono">Subdomain: {store.slug}.platform.com</span>
      </div>
    </footer>
  );
}
