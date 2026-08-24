"use client";

import React from "react";
import { SupportTicket } from "@/types/admin";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Headphones, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface SupportTableProps {
  tickets: SupportTicket[];
  onToggleStatus: (id: string, status: SupportTicket["status"]) => void;
}

export function SupportTable({ tickets, onToggleStatus }: SupportTableProps) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Subject & Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-mono text-xs text-maroon-300 font-bold">
                {t.ticketNumber}
              </TableCell>
              <TableCell>
                <div>
                  <h5 className="font-bold font-heading text-white">{t.customerName}</h5>
                  <span className="text-[11px] text-zinc-500 font-mono">{t.customerEmail}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold text-white text-xs">{t.subject}</p>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">{t.category}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={t.priority === "urgent" || t.priority === "high" ? "error" : "outline"}
                  className="uppercase font-mono text-[10px]"
                >
                  {t.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={t.status === "resolved" ? "success" : t.status === "in_progress" ? "maroon" : "outline"}
                  className="capitalize text-[10px]"
                >
                  {t.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = t.status === "resolved" ? "open" : "resolved";
                    onToggleStatus(t.id, next);
                    toast.success("Ticket Updated", `Ticket #${t.ticketNumber} marked as ${next}.`);
                  }}
                >
                  {t.status === "resolved" ? "Reopen" : "Resolve"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
