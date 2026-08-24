"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Category } from "@/types/category";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoreBasePath } from "@/lib/urls";

export interface CategorySectionProps {
  categories: Category[];
  storeSlug: string;
  className?: string;
  isSubdomain?: boolean;
}

export function CategorySection({ categories, storeSlug, className, isSubdomain = false }: CategorySectionProps) {
  const pathname = usePathname();
  if (!categories || categories.length === 0) return null;

  const isDemo = pathname?.startsWith("/demo");
  const demoTheme = pathname?.split("/")[2] || "luxury";
  const storePrefix = getStoreBasePath(storeSlug, isSubdomain, isDemo, demoTheme);

  return (
    <section className={cn("py-8 px-4 lg:px-8 space-y-4 max-w-7xl mx-auto", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-heading text-white tracking-tight">Browse by Category</h2>
          <p className="text-xs text-zinc-400 font-body">Structured fragrance taxonomies</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            id={`category-${c.slug}`}
            href={`${storePrefix}?category=${c.id}#products`}
            className="group p-4 rounded-2xl bg-[#151515] border border-white/10 hover:border-maroon-600/50 hover:bg-[#181818] transition-all text-center space-y-2 shadow-card"
          >
            <div className="w-12 h-12 rounded-xl bg-maroon-950/60 border border-maroon-700/50 flex items-center justify-center text-maroon-400 mx-auto group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold font-heading text-white group-hover:text-maroon-300 transition-colors">
                {c.name}
              </h3>
              <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">{c.productCount} Items</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
