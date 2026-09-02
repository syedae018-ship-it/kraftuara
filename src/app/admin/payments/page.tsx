"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { AdminPayment } from "@/types/admin";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAdminPaymentsAction } from "@/lib/actions/admin";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getAdminPaymentsAction();
      if (res.success && res.data) {
        setPayments(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const totalCollected = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout>
      <SectionTitle
        title="Payments & Revenue Analytics"
        description="Real-time Razorpay payment events, subscription receipts, and platform cashflow."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <CreditCard className="w-3 h-3 text-maroon-300" /> {formatCurrency(totalCollected)} Total Collected
          </Badge>
        }
      />

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 pb-20">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-[#151515] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center bg-[#151515] font-body text-zinc-500">
            <p className="text-sm font-semibold">No SaaS subscription payment records found.</p>
          </div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="bg-[#151515] border border-white/10 rounded-2xl p-4 space-y-3 font-body">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-maroon-300 font-bold truncate">{p.invoiceNumber}</span>
                <Badge variant={p.status === "succeeded" ? "success" : "error"} className="capitalize text-[9px]">
                  {p.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-xs text-left">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Merchant</span>
                  <span className="font-semibold text-white block text-[11px] mt-0.5 truncate">{p.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Store</span>
                  <span className="text-zinc-300 block text-[11px] mt-0.5 truncate">{p.storeName}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                <Badge variant="maroon" className="font-mono text-[9px]">{p.planName}</Badge>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(p.amount)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body pb-20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction / Payment ID</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Plan Tier</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                  <span className="animate-pulse">Loading payment records...</span>
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-500 text-xs py-12">
                  No SaaS subscription payment records found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-mono text-xs text-maroon-300 font-bold">{p.invoiceNumber}</div>
                    {p.subscriptionId && (
                      <div className="font-mono text-[10px] text-zinc-500 truncate max-w-[140px]">{p.subscriptionId}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-white text-xs">{p.customerName}</TableCell>
                  <TableCell className="text-zinc-300 text-xs">{p.storeName}</TableCell>
                  <TableCell><Badge variant="maroon" className="font-mono text-[10px]">{p.planName}</Badge></TableCell>
                  <TableCell className="font-mono font-bold text-emerald-400 text-xs">{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="font-mono text-zinc-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "succeeded" ? "success" : "error"} className="capitalize text-[10px]">
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
