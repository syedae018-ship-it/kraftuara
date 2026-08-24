"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Settings, Save, ShieldAlert, Mail, Server } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState("Catalog SaaS Platform");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smtpServer, setSmtpServer] = useState("smtp.resend.com");
  const [commissionRate, setCommissionRate] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Platform Settings Saved", "System configuration updated successfully.");
    }, 500);
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="System & Platform Settings"
        description="Global platform branding, maintenance mode controls, SMTP placeholders, and commission rates."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Settings className="w-3 h-3 text-maroon-300" /> Platform Config
          </Badge>
        }
      />

      <form onSubmit={handleSave} className="max-w-3xl space-y-6 pb-20 font-body">
        <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
          <h3 className="text-base font-bold font-heading text-white">General SaaS Configuration</h3>

          <Input
            label="Platform Brand Name"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            required
          />

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#111111] border border-white/10">
            <div>
              <h5 className="font-bold font-heading text-white text-xs">Maintenance Mode</h5>
              <p className="text-[11px] text-zinc-400">Temporarily disable storefront creation for platform maintenance.</p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors relative border ${
                maintenanceMode ? "bg-maroon-800 border-maroon-600" : "bg-zinc-800 border-zinc-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  maintenanceMode ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
          <h3 className="text-base font-bold font-heading text-white">SMTP & System Services Placeholder</h3>
          <Input
            label="SMTP Relay Host"
            value={smtpServer}
            onChange={(e) => setSmtpServer(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
          />
          <Input
            label="Platform Commission Rate (%)"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            type="number"
          />
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Save Platform Settings
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
