"use client";

import React, { useState } from "react";
import { AppearanceSettings } from "@/types/theme";
import { ColorPicker } from "./color-picker";
import { TypographyPicker } from "./typography-picker";
import { SectionSorter } from "./section-sorter";
import { SEOCard } from "@/components/products/seo-card";
import { ImageUploader } from "@/components/products/image-uploader";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Palette, Type, Layers, Share2, Globe, Sparkles, ChevronDown, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppearanceSidebarProps {
  settings: AppearanceSettings;
  onChange: (updated: Partial<AppearanceSettings>) => void;
  className?: string;
}

type AccordionTab = "branding" | "colors" | "typography" | "sections" | "social" | "seo";

export function AppearanceSidebar({ settings, onChange, className }: AppearanceSidebarProps) {
  const [openTab, setOpenTab] = useState<AccordionTab>("branding");

  const toggleTab = (tab: AccordionTab) => {
    setOpenTab((prev) => (prev === tab ? ("" as any) : tab));
  };

  return (
    <div className={cn("w-full lg:w-[420px] bg-[#111111] border-r border-white/10 p-4 space-y-4 overflow-y-auto shrink-0", className)}>
      <div className="pb-2 border-b border-white/10">
        <h3 className="text-sm font-bold font-heading text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-maroon-400" /> Store Appearance Customizer
        </h3>
        <p className="text-xs text-zinc-400 font-body mt-0.5">
          Configure branding, theme colors, typography, and homepage section order.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {/* 1. Store Branding & Assets */}
        <Card className="bg-[#151515] border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleTab("branding")}
            className="w-full p-4 flex items-center justify-between text-left font-heading text-xs font-bold text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-maroon-400" /> Branding & Media Assets
            </div>
            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", openTab === "branding" && "rotate-180")} />
          </button>
          {openTab === "branding" && (
            <div className="p-4 pt-0 space-y-4 border-t border-white/5">
              <Input
                label="Store Business Name"
                value={settings.branding.name}
                onChange={(e) => onChange({ branding: { ...settings.branding, name: e.target.value } })}
              />
               <Input
                label="Tagline / Slogan"
                value={settings.branding.tagline}
                onChange={(e) => onChange({ branding: { ...settings.branding, tagline: e.target.value } })}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 font-heading">Store Description / About</label>
                <textarea
                  value={settings.branding.description || ""}
                  onChange={(e) => onChange({ branding: { ...settings.branding, description: e.target.value } })}
                  rows={3}
                  className="w-full bg-[#111111] border border-white/10 text-white rounded-xl p-2.5 text-xs outline-none focus:border-maroon-600 resize-none font-body"
                  placeholder="Describe your boutique store..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 font-heading">Store Logo Image</label>
                <ImageUploader
                  images={
                    settings.branding.logoUrl
                      ? [{ id: "logo-img", url: settings.branding.logoUrl, position: 0, isCover: true }]
                      : []
                  }
                  onChange={(imgs) => onChange({ branding: { ...settings.branding, logoUrl: imgs[0]?.url || "" } })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label className="text-xs font-semibold text-zinc-300 font-heading">Hero Banner Image (16:9 ratio)</label>
                  <span className="text-[10px] text-zinc-500 font-mono">16:9 Aspect Ratio</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-body">
                  One 16:9 source banner scales smoothly across Desktop, Tablet, and Mobile without stretching.
                </p>
                <ImageUploader
                  images={
                    settings.branding.heroBannerUrl
                      ? [{ id: "hero-img", url: settings.branding.heroBannerUrl, position: 0, isCover: true }]
                      : []
                  }
                  onChange={(imgs) => onChange({ branding: { ...settings.branding, heroBannerUrl: imgs[0]?.url || "" } })}
                />
              </div>
            </div>
          )}
        </Card>

        {/* 2. Color Palette */}
        <Card className="bg-[#151515] border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleTab("colors")}
            className="w-full p-4 flex items-center justify-between text-left font-heading text-xs font-bold text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-maroon-400" /> Color Palette & Theme Tokens
            </div>
            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", openTab === "colors" && "rotate-180")} />
          </button>
          {openTab === "colors" && (
            <div className="p-4 pt-0 border-t border-white/5">
              <ColorPicker settings={settings} onChange={onChange} />
            </div>
          )}

        </Card>

        {/* 3. Typography & Styles */}
        <Card className="bg-[#151515] border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleTab("typography")}
            className="w-full p-4 flex items-center justify-between text-left font-heading text-xs font-bold text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-maroon-400" /> Typography & Styles
            </div>
            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", openTab === "typography" && "rotate-180")} />
          </button>
          {openTab === "typography" && (
            <div className="p-4 pt-0 border-t border-white/5">
              <TypographyPicker typography={settings.typography} onChange={(typography) => onChange({ typography })} />
            </div>
          )}
        </Card>

        {/* 4. Homepage Section Builder (Removed from view as it does not affect Bloom storefront design) */}

        {/* 5. Social & Contact Details */}
        <Card className="bg-[#151515] border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleTab("social")}
            className="w-full p-4 flex items-center justify-between text-left font-heading text-xs font-bold text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-maroon-400" /> Social Handles & Contact
            </div>
            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", openTab === "social" && "rotate-180")} />
          </button>
          {openTab === "social" && (
            <div className="p-4 pt-0 space-y-3 border-t border-white/5">
              <Input
                label="Support Email"
                value={settings.branding.email || ""}
                onChange={(e) => onChange({ branding: { ...settings.branding, email: e.target.value } })}
              />
              <Input
                label="Phone Number"
                value={settings.branding.phone || ""}
                onChange={(e) => onChange({ branding: { ...settings.branding, phone: e.target.value } })}
              />
              <div className="space-y-1">
                <Input
                  label="WhatsApp Business Number (Cart Orders)"
                  placeholder="e.g. +91 98765 43210"
                  value={settings.branding.whatsapp || ""}
                  onChange={(e) => onChange({ branding: { ...settings.branding, whatsapp: e.target.value } })}
                />
                <p className="text-[10px] text-zinc-500 font-body">
                  Customers will send their completed cart orders to this WhatsApp number.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 font-heading">Business Physical Address</label>
                <textarea
                  value={settings.branding.address || ""}
                  onChange={(e) => onChange({ branding: { ...settings.branding, address: e.target.value } })}
                  rows={2}
                  className="w-full bg-[#111111] border border-white/10 text-white rounded-xl p-2.5 text-xs outline-none focus:border-maroon-600 resize-none font-body"
                  placeholder="123 Fashion St, Style City..."
                />
              </div>
              <Input
                label="Instagram URL / Handle"
                value={settings.branding.instagram || ""}
                onChange={(e) => onChange({ branding: { ...settings.branding, instagram: e.target.value } })}
              />
              <Input
                label="Facebook URL / Handle"
                value={settings.branding.facebook || ""}
                onChange={(e) => onChange({ branding: { ...settings.branding, facebook: e.target.value } })}
              />
            </div>
          )}
        </Card>

        {/* 6. SEO Card */}
        <Card className="bg-[#151515] border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleTab("seo")}
            className="w-full p-4 flex items-center justify-between text-left font-heading text-xs font-bold text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-maroon-400" /> Homepage SEO & OpenGraph
            </div>
            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", openTab === "seo" && "rotate-180")} />
          </button>
          {openTab === "seo" && (
            <div className="p-4 pt-0 border-t border-white/5">
              <SEOCard
                productName={settings.branding.name}
                slug="homepage"
                seoTitle={settings.seo.seoTitle}
                seoDescription={settings.seo.seoDescription}
                onSlugChange={() => {}}
                onSeoTitleChange={(seoTitle) => onChange({ seo: { ...settings.seo, seoTitle } })}
                onSeoDescriptionChange={(seoDescription) => onChange({ seo: { ...settings.seo, seoDescription } })}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
