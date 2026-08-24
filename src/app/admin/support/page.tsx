"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { SupportTable } from "@/components/admin/support-table";
import { SupportTicket } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { Headphones } from "lucide-react";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    async function loadData() {
      const t = await adminRepository.getSupportTickets();
      setTickets(t);
    }
    loadData();
  }, []);

  const handleToggleStatus = async (id: string, nextStatus: SupportTicket["status"]) => {
    await adminRepository.updateTicketStatus(id, nextStatus);
    setTickets(tickets.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)));
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="Customer Support Tickets Queue"
        description="Review merchant inquiries, technical support tickets, and domain configuration requests."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Headphones className="w-3 h-3 text-maroon-300" /> {tickets.length} Active Tickets
          </Badge>
        }
      />

      <div className="pb-20">
        <SupportTable tickets={tickets} onToggleStatus={handleToggleStatus} />
      </div>
    </AdminLayout>
  );
}
