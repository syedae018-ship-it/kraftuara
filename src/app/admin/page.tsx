"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { PlatformHealthCard } from "@/components/admin/platform-health-card";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { UserTable } from "@/components/admin/user-table";
import { StoreTable } from "@/components/admin/store-table";
import { PlatformStats, AdminUser, AdminStore } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { ShieldAlert, Users, Store } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);

  useEffect(() => {
    async function loadData() {
      const s = await adminRepository.getStats();
      const u = await adminRepository.getUsers();
      const str = await adminRepository.getStores();
      setStats(s);
      setUsers(u);
      setStores(str);
    }
    loadData();
  }, []);

  const handleToggleUserStatus = async (id: string, current: AdminUser["status"]) => {
    const next = current === "active" ? "suspended" : "active";
    const updated = await adminRepository.updateUserStatus(id, next);
    setUsers(users.map((u) => (u.id === id ? updated : u)));
    toast.success("User Updated", `Merchant ${updated.name} status changed to ${next}.`);
  };

  const handleToggleStoreStatus = async (id: string, current: AdminStore["status"]) => {
    const next = current === "live" ? "suspended" : "live";
    const updated = await adminRepository.updateStoreStatus(id, next);
    setStores(stores.map((s) => (s.id === id ? updated : s)));
    toast.success("Store Updated", `Store ${updated.name} status changed to ${next}.`);
  };

  if (!stats) return null;

  return (
    <AdminLayout>
      <SectionTitle
        title="SaaS Platform Super Control"
        description="Global metrics, merchant stores, platform MRR, infrastructure status, and account management."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <ShieldAlert className="w-3 h-3 text-maroon-300" /> Platform Super Admin
          </Badge>
        }
      />

      <div className="space-y-6 pb-20">
        <AdminStatCard stats={stats} />
        <PlatformHealthCard />
        <AnalyticsChart />

        <div className="space-y-4">
          <h3 className="text-base font-bold font-heading text-white">Merchant User Accounts</h3>
          <UserTable users={users} onToggleStatus={handleToggleUserStatus} />
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold font-heading text-white">Active Stores & Subdomains</h3>
          <StoreTable stores={stores} onToggleStatus={handleToggleStoreStatus} />
        </div>
      </div>
    </AdminLayout>
  );
}
