"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Settings, Save, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getPlatformSettingsAction, updatePlatformSettingsAction } from "@/lib/actions/admin";

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState("Kraftaura SaaS");
  const [supportEmail, setSupportEmail] = useState("support@kraftaura.in");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enableSignups, setEnableSignups] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const res = await getPlatformSettingsAction();
      if (res.success && res.data) {
        setPlatformName(res.data.platformName || "Kraftaura SaaS");
        setSupportEmail(res.data.supportEmail || "support@kraftaura.in");
        setMaintenanceMode(!!res.data.maintenanceMode);
        setEnableSignups(res.data.enableSignups !== false);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        platformName,
        supportEmail,
        maintenanceMode,
        enableSignups,
      };
      const res = await updatePlatformSettingsAction(payload);
      if (res.success) {
        toast.success("Platform Settings Saved", "System configuration updated successfully.");
      } else {
        toast.error("Save Failed", res.error || "Failed to update platform settings.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="System & Platform Settings"
        description="Global platform configuration, support contact, and merchant registration controls."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Settings className="w-3 h-3 text-maroon-300" /> Platform Config
          </Badge>
        }
      />

      <form onSubmit={handleSave} className="max-w-3xl space-y-6 pb-20 font-body text-left">
        <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
          <h3 className="text-base font-bold font-heading text-white">General SaaS Configuration</h3>

          <Input
            label="Platform Brand Name"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            required
          />

          <Input
            label="Official Support Email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
            required
          />

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#111111] border border-white/10">
            <div>
              <h5 className="font-bold font-heading text-white text-xs">Maintenance Mode</h5>
              <p className="text-[11px] text-zinc-400">Temporarily display maintenance banner for platform upgrades.</p>
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

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#111111] border border-white/10">
            <div>
              <h5 className="font-bold font-heading text-white text-xs">Merchant Registration</h5>
              <p className="text-[11px] text-zinc-400">Allow new merchants to register and create storefronts.</p>
            </div>
            <button
              type="button"
              onClick={() => setEnableSignups(!enableSignups)}
              className={`w-12 h-6 rounded-full transition-colors relative border ${
                enableSignups ? "bg-emerald-800 border-emerald-600" : "bg-zinc-800 border-zinc-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  enableSignups ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
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
