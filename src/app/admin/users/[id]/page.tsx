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
import { Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { initialProducts } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, ArrowLeft, ExternalLink, LogIn, Store, Package, ShoppingBag, CreditCard, Settings, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getStoreUrl } from "@/lib/urls";

type UserTab = "overview" | "store" | "products" | "creative" | "analytics" | "billing" | "settings";

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { impersonate } = useAuth();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<UserTab>("overview");

  useEffect(() => {
    async function loadUser() {
      const list = await adminRepository.getUsers();
      const found = list.find((u) => u.id === id) || list[0];
      setUser(found);
    }
    loadUser();
  }, [id]);

  if (!user) return null;

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
              Open Dashboard (Impersonate)
            </Button>
            <Link href={getStoreUrl(user.storeSlug)} target="_blank">
              <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Preview Store
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6 pb-20 font-body">
        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-heading font-semibold overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "store", label: "Store Info", icon: Store },
            { id: "products", label: "Products Catalog", icon: Package },
            { id: "creative", label: "Creative Orders", icon: Sparkles },
            { id: "analytics", label: "Store Analytics", icon: Activity },
            { id: "billing", label: "Billing & Plan", icon: CreditCard },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as UserTab)}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0",
                  activeTab === t.id
                    ? "bg-maroon-800 text-white shadow-glow border border-maroon-600/50"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
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
                  <span className="text-zinc-500">Subdomain URL:</span>
                  <span className="font-mono text-maroon-300">{user.storeSlug}.platform.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subscription Plan:</span>
                  <strong className="font-mono text-emerald-400">{user.plan}</strong>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Store */}
        {activeTab === "store" && (
          <Card className="p-5 space-y-3 bg-[#151515] border-white/10 text-xs">
            <h4 className="font-bold font-heading text-white text-sm">Store Configuration</h4>
            <p className="text-zinc-400">Subdomain: <strong className="text-white font-mono">{user.storeSlug}.platform.com</strong></p>
            <p className="text-zinc-400">Active Theme: <strong className="text-white font-heading">Luxury Oud Dark</strong></p>
          </Card>
        )}

        {/* Tab 3: Products */}
        {activeTab === "products" && (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#151515]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-white text-xs">{p.name}</TableCell>
                    <TableCell className="text-zinc-400 text-xs">{p.categoryName}</TableCell>
                    <TableCell className="font-mono text-xs text-white">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="font-mono text-xs text-emerald-400">{p.stock} in stock</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 4: Creative Orders */}
        {activeTab === "creative" && (
          <Card className="p-5 bg-[#151515] border-white/10 text-xs text-zinc-400">
            Active Creative Studio Requests: <strong className="text-white">1 In Production (CRV-9081)</strong>
          </Card>
        )}

        {/* Tab 5: Analytics */}
        {activeTab === "analytics" && (
          <Card className="p-5 bg-[#151515] border-white/10 text-xs text-zinc-400">
            Total Monthly Store Views: <strong className="text-emerald-400 font-mono">1,420 Page Views</strong>
          </Card>
        )}

        {/* Tab 6: Billing */}
        {activeTab === "billing" && (
          <Card className="p-5 bg-[#151515] border-white/10 text-xs text-zinc-400">
            Current Tier: <strong className="text-white">{user.plan}</strong> • Renewal: <span className="font-mono">2026-03-01</span>
          </Card>
        )}

        {/* Tab 7: Settings */}
        {activeTab === "settings" && (
          <Card className="p-5 bg-[#151515] border-white/10 space-y-3">
            <h4 className="font-bold font-heading text-white text-sm">Account Controls</h4>
            <Button variant="danger" size="sm">
              Suspend Account
            </Button>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
