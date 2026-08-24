"use client";

import React, { useState } from "react";
import { Theme } from "@/types/theme";
import { ThemeCard } from "./theme-card";
import { ThemePreviewModal } from "./theme-preview-modal";
import { cn } from "@/lib/utils";

export interface ThemeGalleryProps {
  themes: Theme[];
  onApplyTheme: (id: string) => void;
  className?: string;
}

export function ThemeGallery({ themes, onApplyTheme, className }: ThemeGalleryProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            onApplyTheme={onApplyTheme}
            onPreviewTheme={setSelectedTheme}
          />
        ))}
      </div>

      <ThemePreviewModal
        theme={selectedTheme}
        isOpen={Boolean(selectedTheme)}
        onClose={() => setSelectedTheme(null)}
        onApplyTheme={onApplyTheme}
      />
    </div>
  );
}
