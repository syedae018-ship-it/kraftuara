"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collection } from "@/types/collection";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoreBasePath } from "@/lib/urls";

export interface CollectionSectionProps {
  collections: Collection[];
  storeSlug: string;
  className?: string;
  isSubdomain?: boolean;
}

export function CollectionSection({ collections, storeSlug, className, isSubdomain = false }: CollectionSectionProps) {
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo");
  const demoTheme = pathname?.split("/")[2] || "luxury";
  const storePrefix = getStoreBasePath(storeSlug, isSubdomain, isDemo, demoTheme);

  if (collections.length === 0) return null;

  return (
    <section id="collections" className={cn("py-8 px-4 lg:px-8 space-y-4 max-w-7xl mx-auto", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2
            style={{ color: "var(--color-text-primary)" }}
            className="text-lg font-bold font-heading tracking-tight"
          >
            Curated Collections
          </h2>
          <p
            style={{ color: "var(--color-text-secondary)" }}
            className="text-xs font-body"
          >
            Special themes, festive gift sets & bundles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`${storePrefix}?collection=${col.id}#products`}
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
            className="group relative h-44 rounded-2xl border overflow-hidden p-5 flex flex-col justify-end transition-all hover:shadow-lg shadow-sm"
          >
            {col.coverImage && (
              <img
                src={col.coverImage}
                alt={col.name}
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

            <div className="relative z-10 space-y-1">
              <span
                style={{ color: "var(--color-accent)" }}
                className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> {col.productCount} Items
              </span>
              <h3
                style={{ color: "var(--color-text-primary)" }}
                className="text-base font-bold font-heading transition-colors"
              >
                {col.name}
              </h3>
              {col.description && (
                <p
                  style={{ color: "var(--color-text-secondary)" }}
                  className="text-xs font-body line-clamp-1 leading-relaxed"
                >
                  {col.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
