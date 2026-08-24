"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ThemeTable } from "@/components/admin/theme-table";
import { Template } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { Palette } from "lucide-react";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    async function loadData() {
      const t = await adminRepository.getTemplates();
      setTemplates(t);
    }
    loadData();
  }, []);

  const handleCreateTemplate = async (input: Omit<Template, "id" | "activeStoresCount">) => {
    const created = await adminRepository.createTemplate(input);
    setTemplates([created, ...templates]);
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="Theme & Store Templates Engine"
        description="Publish, update, and manage luxury theme presets available for catalog merchants."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Palette className="w-3 h-3 text-maroon-300" /> {templates.length} Theme Presets
          </Badge>
        }
      />

      <div className="pb-20">
        <ThemeTable templates={templates} onCreateTemplate={handleCreateTemplate} />
      </div>
    </AdminLayout>
  );
}
