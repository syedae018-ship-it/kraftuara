"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { AdminPayment } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);

  useEffect(() => {
    async function loadData() {
      const p = await adminRepository.getPayments();
      setPayments(p);
    }
    loadData();
  }, []);

  return (
    <AdminLayout>
      <SectionTitle
        title="Payments & Revenue Analytics"
        description="Subscription invoices, merchant billing history, and platform MRR receipts."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <CreditCard className="w-3 h-3 text-maroon-300" /> Revenue Stream
          </Badge>
        }
      />

      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body pb-20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Plan Tier</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs text-maroon-300 font-bold">{p.invoiceNumber}</TableCell>
                <TableCell className="font-semibold text-white text-xs">{p.customerName}</TableCell>
                <TableCell className="text-zinc-300 text-xs">{p.storeName}</TableCell>
                <TableCell><Badge variant="maroon" className="font-mono text-[10px]">{p.planName}</Badge></TableCell>
                <TableCell className="font-mono font-bold text-emerald-400 text-xs">{formatCurrency(p.amount)}</TableCell>
                <TableCell><Badge variant="success" className="capitalize text-[10px]">{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
