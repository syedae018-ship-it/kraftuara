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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [s, u, str] = await Promise.all([
          adminRepository.getStats(),
          adminRepository.getUsers(),
          adminRepository.getStores(),
        ]);
        setStats(s);
        setUsers(u);
        setStores(str);
      } finally {
        setLoading(false);
      }
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

  const handleUserDeleted = (deletedId: string) => {
    setUsers(users.filter((u) => u.id !== deletedId));
  };

  const handleStoreDeleted = (deletedId: string) => {
    setStores(stores.filter((s) => s.id !== deletedId));
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="SaaS Platform Super Control"
        description="Live platform metrics, active merchant stores, subscription revenue, and real-time management."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <ShieldAlert className="w-3 h-3 text-maroon-300" /> Platform Super Admin
          </Badge>
        }
      />

      <div className="space-y-6 pb-20 text-left">
        {stats ? (
          <AdminStatCard stats={stats} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[#151515] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* SaaS Subscription Billing Metrics Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subscriptions Status Card */}
            <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading">
                Platform Subscriptions
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block">TOTAL SUBSCRIBERS</span>
                  <span className="text-xl font-extrabold text-white font-heading">{stats.totalSubscribers || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block font-bold text-emerald-400">ACTIVE SUBSCRIPTIONS</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-heading">{stats.activeSubscriptions || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block text-amber-400">TRIAL USERS</span>
                  <span className="text-xl font-extrabold text-amber-400 font-heading">{stats.trialUsers || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block text-rose-400">EXPIRED / CANCELLED</span>
                  <span className="text-xl font-extrabold text-rose-400 font-heading">
                    {(stats.expiredSubscriptions || 0) + (stats.cancelledSubscriptions || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Receipts Card */}
            <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading">
                Platform Payments & Revenue
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block font-bold text-emerald-400">SUCCESSFUL PAYMENTS</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-heading">{stats.successfulPaymentsCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block text-rose-400">FAILED PAYMENTS</span>
                  <span className="text-xl font-extrabold text-rose-400 font-heading">{stats.failedPaymentsCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block">TOTAL REVENUE RECVD</span>
                  <span className="text-xl font-extrabold text-white font-heading">₹{(stats.totalRevenue || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block">PLATFORM MRR</span>
                  <span className="text-xl font-extrabold text-white font-heading">₹{(stats.mrr || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Plan Distribution Card */}
            <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-4 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading">
                Active Tier Distribution
              </h4>
              <div className="space-y-2.5 font-body text-xs flex-grow justify-center flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Startup Pack (₹99)</span>
                  <span className="font-bold text-white">{stats.planStarterCount || 0} stores</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Growth Pack (₹299)</span>
                  <span className="font-bold text-white">{stats.planProCount || 0} stores</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Pro Plan (₹499)</span>
                  <span className="font-bold text-white">{stats.planBusinessCount || 0} stores</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <PlatformHealthCard />
        <AnalyticsChart />

        <div className="space-y-4">
          <h3 className="text-base font-bold font-heading text-white">Merchant User Accounts</h3>
          <UserTable
            users={users}
            onToggleStatus={handleToggleUserStatus}
            onUserDeleted={handleUserDeleted}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold font-heading text-white">Active Stores & Subdomains</h3>
          <StoreTable
            stores={stores}
            onToggleStatus={handleToggleStoreStatus}
            onStoreDeleted={handleStoreDeleted}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
