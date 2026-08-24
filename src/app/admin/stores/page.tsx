"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { StoreTable } from "@/components/admin/store-table";
import { AdminStore } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { Store } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminStoresPage() {
  const [stores, setStores] = useState<AdminStore[]>([]);

  useEffect(() => {
    async function loadData() {
      const str = await adminRepository.getStores();
      setStores(str);
    }
    loadData();
  }, []);

  const handleToggleStoreStatus = async (id: string, current: AdminStore["status"]) => {
    const next = current === "live" ? "suspended" : "live";
    const updated = await adminRepository.updateStoreStatus(id, next);
    setStores(stores.map((s) => (s.id === id ? updated : s)));
    toast.success("Store Updated", `Store ${updated.name} status changed to ${next}.`);
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="Store & Domain Management"
        description="Monitor subdomains, active themes, catalog sizes, and live store statuses."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Store className="w-3 h-3 text-maroon-300" /> {stores.length} Multi-Tenant Stores
          </Badge>
        }
      />

      <div className="pb-20">
        <StoreTable stores={stores} onToggleStatus={handleToggleStoreStatus} />
      </div>
    </AdminLayout>
  );
}
