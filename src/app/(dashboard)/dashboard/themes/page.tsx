"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ThemeGallery } from "@/components/themes/theme-gallery";
import { Theme } from "@/types/theme";
import { themeRepository } from "@/lib/repositories/theme-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Palette, Sparkles, SlidersHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ThemeGalleryPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchThemes = async () => {
    setIsLoading(true);
    try {
      const data = await themeRepository.getAll();
      setThemes(data);
    } catch (err) {
      toast.error("Error", "Could not load theme gallery.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleApplyTheme = async (id: string) => {
    const applied = await themeRepository.applyTheme(id);
    if (applied) {
      toast.success("Theme Applied!", `Switched active storefront theme to "${applied.name}".`);
      fetchThemes();
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Theme Gallery" }]}>
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
        <ThemeGallery themes={themes} onApplyTheme={handleApplyTheme} />
      </div>
    </DashboardLayout>
  );
}
