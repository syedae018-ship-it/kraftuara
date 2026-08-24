"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AppearanceSidebar } from "@/components/appearance/appearance-sidebar";
import { PreviewWindow } from "@/components/appearance/preview-window";
import { AppearanceSettings } from "@/types/theme";
import { appearanceRepository } from "@/lib/repositories/appearance-repository";
import { productRepository } from "@/lib/repositories/product-repository";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { publishStoreChangesAction } from "@/lib/actions/store";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export default function AppearancePage() {
  const { activeStore } = useAuth();
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const [appearanceData, productsData, categoriesData] = await Promise.all([
        appearanceRepository.getSettings(activeStore.id),
        productRepository.getAll(activeStore.id),
        categoryRepository.getAll(activeStore.id),
      ]);
      setSettings(appearanceData);
      setProducts(productsData.products);
      setCategories(categoriesData);
    } catch (err) {
      toast.error("Error", "Could not load appearance settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSettings();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [activeStore]);

  const handleChange = (updatedPartial: Partial<AppearanceSettings>) => {
    if (!settings || !activeStore?.id) return;
    
    // Optimistic / Instant Local State Update
    const merged: AppearanceSettings = {
      ...settings,
      ...updatedPartial,
      branding: { ...settings.branding, ...updatedPartial.branding },
      colors: { ...settings.colors, ...updatedPartial.colors },
      typography: { ...settings.typography, ...updatedPartial.typography },
      seo: { ...settings.seo, ...updatedPartial.seo },
    };
    setSettings(merged);

    // Debounce database write (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await appearanceRepository.updateSettings(activeStore.id, merged);
      } catch (err) {
        console.error("Failed to persist appearance draft:", err);
      }
    }, 500);
  };

  const handleUndo = async () => {
    if (!activeStore?.id) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const res = await appearanceRepository.undo(activeStore.id);
    if (res) {
      setSettings(res);
      toast.info("Undo Applied", "Reverted to previous customization state.");
    }
  };

  const handleRedo = async () => {
    if (!activeStore?.id) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const res = await appearanceRepository.redo(activeStore.id);
    if (res) {
      setSettings(res);
      toast.info("Redo Applied", "Restored customization state.");
    }
  };

  const handleReset = async () => {
    if (!activeStore?.id) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const reset = await appearanceRepository.resetDefaults(activeStore.id);
    setSettings(reset);
    toast.success("Reset Defaults", "Restored original theme settings.");
  };

  const handleSave = async () => {
    if (!activeStore?.id || !settings) return;
    setIsSaving(true);
    try {
      // Flush any pending optimistic/draft changes to the database immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      await appearanceRepository.updateSettings(activeStore.id, settings);

      const res = await publishStoreChangesAction(activeStore.id);
      if (res.success) {
        toast.success("Appearance Saved & Published!", "Storefront changes are now live.");
      } else {
        toast.error("Error", res.error || "Failed to publish storefront changes.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to publish storefront changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("controls");

  if (isLoading || !settings) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Appearance" }]}>
        <div className="flex items-center justify-center p-12 text-zinc-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-maroon-400" /> Loading store customizer...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Appearance Customizer" }]}>
      {/* Mobile Tab Switcher for Screens < lg */}
      <div className="lg:hidden flex items-center p-1 bg-[#151515] border border-white/10 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setMobileTab("controls")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold font-heading transition-all flex items-center justify-center gap-1.5",
            mobileTab === "controls"
              ? "bg-maroon-800 text-white shadow-glow"
              : "text-zinc-400 hover:text-white"
          )}
        >
          Customize
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold font-heading transition-all flex items-center justify-center gap-1.5",
            mobileTab === "preview"
              ? "bg-maroon-800 text-white shadow-glow"
              : "text-zinc-400 hover:text-white"
          )}
        >
          Live Preview
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] -m-4 lg:-m-8 overflow-hidden">
        {/* Left Controls Customizer Panel */}
        <div className={cn("w-full lg:w-auto h-full overflow-y-auto", mobileTab !== "controls" && "hidden lg:block")}>
          <AppearanceSidebar settings={settings} onChange={handleChange} />
        </div>

        {/* Right Live Storefront Website Preview Panel */}
        <div className={cn("flex-1 h-full overflow-hidden", mobileTab !== "preview" && "hidden lg:block")}>
          <PreviewWindow
            settings={settings}
            products={products}
            categories={categories}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            onSave={handleSave}
            canUndo={activeStore ? appearanceRepository.canUndo(activeStore.id) : false}
            canRedo={activeStore ? appearanceRepository.canRedo(activeStore.id) : false}
            isSaving={isSaving}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
