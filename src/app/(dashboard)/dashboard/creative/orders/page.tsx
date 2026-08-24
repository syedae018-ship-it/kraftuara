"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CreativeOrderCard } from "@/components/creative/creative-order-card";
import { CreativeOrder } from "@/types/creative";
import { creativeRepository } from "@/lib/repositories/creative-repository";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, ShoppingBag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CreativeOrdersPage() {
  const [orders, setOrders] = useState<CreativeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const data = await creativeRepository.getOrders();
        setOrders(data);
      } catch (err) {
        toast.error("Error", "Could not load creative orders.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <DashboardLayout breadcrumbs={[{ label: "Creative Hub", href: "/dashboard/creative" }, { label: "My Orders" }]}>
      <SectionTitle
        title="My Creative Orders"
        description="Track production progress, delivery timelines, and submitted design briefs."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <ShoppingBag className="w-3 h-3 text-maroon-300" /> {orders.length} Active Orders
          </Badge>
        }
        action={
          <Link href="/dashboard/creative/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Submit New Brief
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 pb-20">
        {orders.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Sparkles className="w-8 h-8 text-maroon-400" />}
            title="No creative orders yet"
            description="Order AI product shoots, 3D mockups, or Instagram promo banners for your store."
            action={
              <Link href="/dashboard/creative/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Request First Design
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orders.map((ord) => (
              <CreativeOrderCard key={ord.id} order={ord} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
