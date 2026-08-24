"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminCatalogOrdersPage() {
  const mockCatalogOrders = [
    { id: "ord-cat-101", storeName: "Aroma Perfumes", customer: "Farhan K.", total: 140.00, itemsCount: 2, status: "completed", date: "2026-02-05" },
    { id: "ord-cat-102", storeName: "Royal Fashion", customer: "Yasmin A.", total: 320.00, itemsCount: 4, status: "processing", date: "2026-02-04" },
    { id: "ord-cat-103", storeName: "Al Noor Electronics", customer: "Bilal M.", total: 85.00, itemsCount: 1, status: "completed", date: "2026-02-03" },
  ];

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

      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body pb-20">
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
            {mockCatalogOrders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs text-maroon-300 font-bold">{o.id}</TableCell>
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
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
