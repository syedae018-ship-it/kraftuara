"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { adminRepository } from "@/lib/repositories/admin-repository";

export default function AdminCatalogOrdersPage() {
  const [catalogOrders, setCatalogOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const orders = await adminRepository.getCatalogOrders();
      setCatalogOrders(orders);
    }
    loadData();
  }, []);

  return (
    <AdminLayout>
      <SectionTitle
        title="Global Storefront Catalog Orders"
        description="Cross-tenant order tracking and WhatsApp order volume analytics."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <ShoppingBag className="w-3 h-3 text-maroon-300" /> Platform Orders Stream
          </Badge>
        }
      />

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 pb-20">
        {catalogOrders.map((o) => (
          <div key={o.id} className="bg-[#151515] border border-white/10 rounded-2xl p-4 space-y-3 font-body">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-maroon-300 font-bold truncate">{o.id.slice(0, 12)}...</span>
              <Badge variant={o.status === "completed" ? "success" : "maroon"} className="capitalize text-[9px] px-1.5 py-0">
                {o.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-xs text-left">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Storefront</span>
                <span className="font-semibold text-white block text-[11px] mt-0.5 truncate">{o.storeName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Customer</span>
                <span className="text-zinc-300 block text-[11px] mt-0.5 truncate">{o.customer}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
              <span className="font-mono text-zinc-400">{o.itemsCount} items</span>
              <span className="font-mono font-bold text-white">{formatCurrency(o.total)}</span>
            </div>
          </div>
        ))}
        {catalogOrders.length === 0 && (
          <p className="text-center text-zinc-500 text-xs py-8">No orders found yet.</p>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body pb-20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Storefront</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogOrders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs text-maroon-300 font-bold">{o.id.slice(0, 12)}...</TableCell>
                <TableCell className="font-semibold text-white text-xs">{o.storeName}</TableCell>
                <TableCell className="text-zinc-300 text-xs">{o.customer}</TableCell>
                <TableCell className="font-mono text-xs text-zinc-400">{o.itemsCount} items</TableCell>
                <TableCell className="font-mono font-bold text-white text-xs">{formatCurrency(o.total)}</TableCell>
                <TableCell>
                  <Badge variant={o.status === "completed" ? "success" : "maroon"} className="capitalize text-[10px]">
                    {o.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {catalogOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 text-xs py-8">No orders found yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
