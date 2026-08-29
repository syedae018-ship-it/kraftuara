"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { useAuth } from "@/context/auth-context";
import { AdminUser } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, LogIn, Store, CreditCard, ShieldAlert } from "lucide-react";
import { getStoreUrl } from "@/lib/urls";
import { toast } from "@/hooks/use-toast";

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { impersonate } = useAuth();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const list = await adminRepository.getUsers();
      const found = list.find((u) => u.id === id);
      setUser(found || null);
      setLoading(false);
    }
    loadUser();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const next = user.status === "active" ? "suspended" : "active";
    const updated = await adminRepository.updateUserStatus(user.id, next);
    setUser(updated);
    toast.success("Status Updated", `Merchant ${updated.name} changed to ${next}.`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-zinc-500 font-mono text-xs">
          Loading merchant account details...
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="py-20 text-center space-y-4">
          <p className="text-zinc-400 font-semibold">Merchant account not found.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")}>
            Back to Users
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const storeUrl = user.storeSlug ? getStoreUrl(user.storeSlug) : "";

  return (
    <AdminLayout>
      <SectionTitle
        title={`Merchant: ${user.name}`}
        description={`Email: ${user.email} • Store: ${user.storeName}`}
        badge={<Badge variant="maroon" className="font-mono text-[11px]">{user.plan}</Badge>}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/users")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Users
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => impersonate(user)}
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              Impersonate
            </Button>
            {storeUrl && (
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Preview Store
                </Button>
              </a>
            )}
          </div>
        }
      />

      <div className="space-y-6 pb-20 font-body text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-3 bg-[#151515] border-white/10">
            <h4 className="font-bold font-heading text-white text-sm">Merchant Profile Specs</h4>
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Merchant Name:</span>
                <strong className="text-white">{user.name}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Email Address:</span>
                <span className="font-mono text-white">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Account Status:</span>
                <Badge variant={user.status === "active" ? "success" : "error"} className="capitalize text-[10px]">
                  {user.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Joined Date:</span>
                <span className="font-mono text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3 bg-[#151515] border-white/10">
            <h4 className="font-bold font-heading text-white text-sm">Active Store Overview</h4>
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Storefront Name:</span>
                <strong className="text-white">{user.storeName}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Store URL:</span>
                <span className="font-mono text-amber-400">{storeUrl || "No active storefront"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Subscription Tier:</span>
                <strong className="font-mono text-emerald-400">{user.plan}</strong>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5 space-y-4 bg-[#151515] border-white/10">
          <h4 className="font-bold font-heading text-white text-sm">Account Operations</h4>
          <div className="flex items-center gap-3">
            <Button
              variant={user.status === "active" ? "danger" : "primary"}
              size="sm"
              onClick={handleToggleStatus}
            >
              {user.status === "active" ? "Suspend Account" : "Re-activate Account"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => impersonate(user)}
            >
              <LogIn className="w-3.5 h-3.5 mr-1" /> Open Dashboard (Impersonate)
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
