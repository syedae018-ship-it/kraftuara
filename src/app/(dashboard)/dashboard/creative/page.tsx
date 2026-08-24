"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CreativeStatsCard } from "@/components/creative/dashboard/creative-stats-card";
import { OrderFilters } from "@/components/creative/dashboard/order-filters";
import { ServiceGrid } from "@/components/creative/service-grid";
import { CreativeOrderCard } from "@/components/creative/creative-order-card";
import { KanbanBoard } from "@/components/creative/dashboard/kanban-board";
import { CreativeService, CreativeOrder } from "@/types/creative";
import { creativeRepository } from "@/lib/repositories/creative-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingBag, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CreativeHubPage() {
  const [services, setServices] = useState<CreativeService[]>([]);
  const [orders, setOrders] = useState<CreativeOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"services" | "table" | "kanban">("services");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const sList = await creativeRepository.getServices();
        const oList = await creativeRepository.getOrders();
        setServices(sList);
        setOrders(oList);
      } catch (err) {
        toast.error("Error", "Could not load creative services.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
        o.serviceTitle.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || o.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, search, statusFilter, priorityFilter]);

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Creative Hub" }]}>
      <SectionTitle
        title="Creative Hub & Design Studio"
        description="Order high-converting AI product renders, promo banners, 3D mockups, and Instagram reels."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-maroon-300" /> Production Studio
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/creative/orders">
              <Button variant="outline" size="sm" leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}>
                My Creative Orders ({orders.length})
              </Button>
            </Link>
            <Link href="/dashboard/creative/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Custom Brief
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6 pb-20">
        {/* Analytics Stats */}
        <CreativeStatsCard />

        {/* View Mode & Filter Toolbar */}
        <OrderFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Dynamic View Content */}
        {viewMode === "services" ? (
          <ServiceGrid services={services} />
        ) : viewMode === "kanban" ? (
          <KanbanBoard orders={filteredOrders} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredOrders.map((ord) => (
              <CreativeOrderCard key={ord.id} order={ord} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
