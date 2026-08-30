"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ThemeGallery } from "@/components/themes/theme-gallery";
import { Theme } from "@/types/theme";
import { initialThemes } from "@/lib/repositories/theme-constants";
import { appearanceRepository } from "@/lib/repositories/appearance-repository";
import { applyThemeAction } from "@/lib/actions/theme";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Palette, Sparkles, SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { getPlanDisplayName } from "@/lib/feature-gating";

export default function ThemeGalleryPage() {
  const { activeStore } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string>("bloom");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const fetchThemes = async () => {
    setIsLoading(true);
    try {
      let currentActiveId = "bloom";
      if (activeStore?.id) {
        const settings = await appearanceRepository.getSettings(activeStore.id);
        currentActiveId = settings?.themeId || "bloom";
        setActiveThemeId(currentActiveId);
      }

      const mappedThemes = initialThemes.map((t) => ({
        ...t,
        status: t.id === currentActiveId ? ("active" as const) : ("available" as const),
      }));

      setThemes(mappedThemes);
    } catch (err) {
      toast.error("Error", "Could not load theme gallery.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, [activeStore]);

  const handleApplyTheme = async (id: string) => {
    if (!activeStore?.id) return;
    setIsApplying(true);
    try {
      const res = await applyThemeAction(activeStore.id, id);
      if (res.success && res.data) {
        toast.success("Theme Applied!", res.message || `Switched storefront theme to "${res.data.name}".`);
        setActiveThemeId(id);
        setThemes((prev) =>
          prev.map((t) => ({
            ...t,
            status: t.id === id ? ("active" as const) : ("available" as const),
          }))
        );
      } else {
        toast.error("Theme Activation Blocked", res.error || "Could not apply theme.");
      }
    } catch {
      toast.error("Error", "Failed to apply theme.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Theme Gallery" }]}>
      <PlanGate
        requiredPlan="pro"
        featureName="Advanced Themes & Layouts"
        description={`Upgrade to the ${getPlanDisplayName("pro")} to unlock Luxury, Modern, Creative, and bespoke catalog storefront layouts.`}
      >
        <SectionTitle
          title="Theme Gallery & Layouts"
          description="Select a production-grade theme designed for catalog storefronts."
          badge={
            <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
              <Palette className="w-3 h-3 text-maroon-300" /> {themes.length} Themes Available
            </Badge>
          }
          action={
            <Link href="/dashboard/appearance">
              <Button variant="primary" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
                Customize Active Theme
              </Button>
            </Link>
          }
        />

        <div className="pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center p-16 text-zinc-500 gap-2 font-mono text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-maroon-500" />
              Loading themes...
            </div>
          ) : (
            <ThemeGallery themes={themes} onApplyTheme={handleApplyTheme} />
          )}
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
