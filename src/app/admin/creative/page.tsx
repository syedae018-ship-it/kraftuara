"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CreativeOrderCard } from "@/components/creative/creative-order-card";
import { CreativeOrder } from "@/types/creative";
import { creativeRepository } from "@/lib/repositories/creative-repository";
import { Badge } from "@/components/ui/table";
import { Sparkles } from "lucide-react";

export default function AdminCreativePage() {
  const [orders, setOrders] = useState<CreativeOrder[]>([]);

  useEffect(() => {
    async function loadData() {
      const oList = await creativeRepository.getOrders();
      setOrders(oList);
    }
    loadData();
  }, []);

  return (
    <AdminLayout>
      <SectionTitle
        title="Global Creative Studio Orders"
        description="Monitor design production queues, designer assignments, and client asset deliverables."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-maroon-300" /> {orders.length} Active Design Briefs
          </Badge>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
        {orders.map((ord) => (
          <CreativeOrderCard key={ord.id} order={ord} />
        ))}
      </div>
    </AdminLayout>
  );
}
