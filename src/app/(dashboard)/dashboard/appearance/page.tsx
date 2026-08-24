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
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] -m-4 lg:-m-8 overflow-hidden">
        {/* Left Controls Customizer Panel */}
        <AppearanceSidebar settings={settings} onChange={handleChange} />

        {/* Right Live Storefront Website Preview Panel */}
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
    </DashboardLayout>
  );
}
