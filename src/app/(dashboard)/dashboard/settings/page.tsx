"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Settings, Save, Store, Globe, Phone, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";

export default function MerchantSettingsPage() {
  const { activeStore, createStore } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Perfumes");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (activeStore) {
      setStoreName(activeStore.name);
      setSlug(activeStore.slug);
      setCategory(activeStore.category || "Perfumes");
      setLogoUrl(activeStore.logoUrl || "");
    }
  }, [activeStore]);

  if (!activeStore) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Settings" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    createStore(storeName, slug, category, logoUrl, activeStore.primaryColor, activeStore.secondaryColor);
    toast.success("Settings Saved", "Store configurations updated successfully.");
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Settings" }]}>
      <div className="space-y-6 max-w-2xl text-left">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">General Settings</h1>
          <p className="text-xs text-zinc-400 font-body">Manage your multi-tenant digital catalog branding and channels.</p>
        </div>

        <Card className="bg-[#111111] border-white/10 p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Store Display Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                leftIcon={<Store className="w-4 h-4 text-zinc-500" />}
              />

              <Input
                label="Domain Subdomain Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                required
                leftIcon={<Globe className="w-4 h-4 text-zinc-500" />}
              />

              <Input
                label="Category preset"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />

              <Input
                label="Custom Logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button type="submit" variant="primary" className="shadow-glow" leftIcon={<Save className="w-4 h-4" />}>
                Save Configurations
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
