"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CreativeChat } from "@/components/creative/chat/creative-chat";
import { DeliverablesPanel } from "@/components/creative/deliverables/deliverables-panel";
import { AssignmentPanel } from "@/components/creative/admin/assignment-panel";
import { Timeline } from "@/components/creative/admin/timeline";
import { CreativeStatusBadge } from "@/components/creative/status-badge";
import { CreativeOrder } from "@/types/creative";
import { creativeRepository } from "@/lib/repositories/creative-repository";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Paperclip, Link as LinkIcon, Calendar, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CreativeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<CreativeOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    setIsLoading(true);
    const data = await creativeRepository.getOrderById(id);
    if (!data) {
      toast.error("Not Found", "Order could not be found.");
      router.push("/dashboard/creative/orders");
      return;
    }
    setOrder(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id, router]);

  if (isLoading || !order) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Creative Orders", href: "/dashboard/creative/orders" }, { label: "Order Workspace" }]}>
        <div className="flex items-center justify-center p-12 text-zinc-400 gap-2 font-body">
          <Loader2 className="w-5 h-5 animate-spin text-maroon-400" /> Loading order workspace...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Creative Orders", href: "/dashboard/creative/orders" }, { label: order.orderNumber }]}>
      <SectionTitle
        title={`Workspace: ${order.projectTitle}`}
        description={`Service: ${order.serviceTitle} • Priority: ${order.priority.toUpperCase()}`}
        badge={<CreativeStatusBadge status={order.status} />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/creative/orders")}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Orders
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 items-start">
        {/* Left Pane (7 Cols): Brief Summary, Chat, Deliverables */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brief Summary */}
          <Card className="p-6 space-y-3 bg-[#151515] border-white/10 font-body">
            <h3 className="text-sm font-bold font-heading text-white">Creative Brief & Requirements</h3>
            <div className="bg-[#111111] p-4 rounded-xl border border-white/5 space-y-2 text-xs leading-relaxed text-zinc-300">
              <p>{order.requirements}</p>
            </div>
          </Card>

          {/* Customer ↔ Designer Linear Chat */}
          <CreativeChat orderId={order.id} />

          {/* Storage Deliverables Panel */}
          <DeliverablesPanel orderId={order.id} />
        </div>

        {/* Right Pane (5 Cols): Admin Assignment & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Admin Assignment Controls */}
          <AssignmentPanel orderId={order.id} onAssignmentUpdated={fetchOrder} />

          {/* Activity Log & Timeline */}
          <Timeline orderId={order.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
