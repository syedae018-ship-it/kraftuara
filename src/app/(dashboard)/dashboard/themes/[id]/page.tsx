"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Theme } from "@/types/theme";
import { themeRepository } from "@/lib/repositories/theme-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, Sparkles, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ThemeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [theme, setTheme] = useState<Theme | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      setIsLoading(true);
      const data = await themeRepository.getById(id);
      if (!data) {
        toast.error("Not Found", "Theme could not be found.");
        router.push("/dashboard/themes");
        return;
      }
      setTheme(data);
      setIsLoading(false);
    }
    loadTheme();
  }, [id, router]);

  const handleApplyTheme = async () => {
    if (!theme) return;
    await themeRepository.applyTheme(theme.id);
    toast.success("Theme Applied!", `Applied "${theme.name}" to your catalog store.`);
    router.push("/dashboard/appearance");
  };

  if (isLoading || !theme) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Themes", href: "/dashboard/themes" }, { label: "Theme Details" }]}>
        <div className="flex items-center justify-center p-12 text-zinc-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-maroon-400" /> Loading theme preview...
        </div>
      </DashboardLayout>
    );
  }

  const isActive = theme.status === "active";

  return (
    <DashboardLayout breadcrumbs={[{ label: "Themes", href: "/dashboard/themes" }, { label: theme.name }]}>
      <SectionTitle
        title={theme.name}
        description={theme.description}
        badge={
          isActive ? (
            <Badge variant="maroon" className="gap-1 font-mono text-[11px] bg-maroon-800 text-white">
              <CheckCircle2 className="w-3 h-3 text-white" /> Active Store Theme
            </Badge>
          ) : (
            <Badge variant="outline" className="font-mono text-[11px]">
              v{theme.version}
            </Badge>
          )
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/themes")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Gallery
            </Button>
            <Button
              variant={isActive ? "secondary" : "primary"}
              size="sm"
              disabled={isActive}
              onClick={handleApplyTheme}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              {isActive ? "Active Theme" : "Apply Theme to Store"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6 pb-20">
        {/* Device Switcher Toolbar */}
        <div className="flex items-center justify-between p-4 bg-[#151515] border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold font-heading text-white">Device Preview Mode:</span>
            <span className="text-xs font-mono text-zinc-400 uppercase">{device}</span>
          </div>

          <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
                device === "desktop" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("tablet")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
                device === "tablet" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Tablet className="w-3.5 h-3.5" /> Tablet
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
                device === "mobile" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        </div>

        {/* Live Device Frame Container */}
        <div className="flex justify-center p-8 bg-[#050505] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div
            className={cn(
              "transition-all duration-300 rounded-2xl overflow-hidden border border-white/10 bg-[#080808] shadow-2xl p-4 flex flex-col justify-between my-auto",
              device === "mobile" && "w-[375px] h-[600px]",
              device === "tablet" && "w-[768px] h-[650px]",
              device === "desktop" && "w-full max-w-5xl h-[650px]"
            )}
          >
            <img src={theme.previewImages[0] || theme.thumbnail} alt={theme.name} className="w-full h-full object-cover rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
