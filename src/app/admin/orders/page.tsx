"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ShoppingBag, Eye, Phone, MapPin, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAdminCatalogOrdersAction } from "@/lib/actions/admin";

export default function AdminCatalogOrdersPage() {
  const [catalogOrders, setCatalogOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getAdminCatalogOrdersAction();
      if (res.success && res.data) {
        setCatalogOrders(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <AdminLayout>
      <SectionTitle
        title="Global Storefront Catalog Orders"
        description="Cross-tenant real-time order stream, customer records, and item breakdowns."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <ShoppingBag className="w-3 h-3 text-maroon-300" /> {catalogOrders.length} Platform Orders
          </Badge>
        }
      />

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 pb-20">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#151515] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : catalogOrders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center bg-[#151515] font-body text-zinc-500">
            <p className="text-sm font-semibold">No catalog orders placed across storefronts yet.</p>
          </div>
        ) : (
          catalogOrders.map((o) => (
            <div key={o.id} className="bg-[#151515] border border-white/10 rounded-2xl p-4 space-y-3 font-body">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-maroon-300 font-bold truncate">#{o.orderNumber}</span>
                <Badge variant={o.status === "delivered" ? "success" : "maroon"} className="capitalize text-[9px] px-1.5 py-0">
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
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{formatCurrency(o.total)}</span>
                  <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedOrder(o)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                </div>
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
              <TableHead>Order #</TableHead>
              <TableHead>Storefront</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                  <span className="animate-pulse">Loading real catalog orders...</span>
                </TableCell>
              </TableRow>
            ) : catalogOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-500 text-xs py-12">
                  No catalog orders placed across storefronts yet.
                </TableCell>
              </TableRow>
            ) : (
              catalogOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs text-maroon-300 font-bold">#{o.orderNumber}</TableCell>
                  <TableCell className="font-semibold text-white text-xs">{o.storeName}</TableCell>
                  <TableCell className="text-zinc-300 text-xs">{o.customer}</TableCell>
                  <TableCell className="font-mono text-zinc-400 text-xs">{o.customerPhone || "N/A"}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">{o.itemsCount} items</TableCell>
                  <TableCell className="font-mono font-bold text-white text-xs">{formatCurrency(o.total)}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === "delivered" ? "success" : "maroon"} className="capitalize text-[10px]">
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(o)} className="text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.orderNumber}`}
          description={`Placed on ${selectedOrder.storeName} • ${new Date(selectedOrder.createdAt).toLocaleString()}`}
        >
          <div className="space-y-4 pt-2 font-body text-xs text-left">
            {/* Customer Details */}
            <div className="p-3.5 rounded-xl bg-[#111111] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold font-heading">
                <Phone className="w-3.5 h-3.5 text-maroon-400" />
                <span>Customer: {selectedOrder.customer} ({selectedOrder.customerPhone || "No Phone"})</span>
              </div>
              {selectedOrder.shippingAddress && (
                <div className="flex items-start gap-2 text-zinc-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <span>{selectedOrder.shippingAddress}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="p-3.5 rounded-xl bg-[#111111] border border-white/5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ordered Items</span>
              <div className="space-y-2 pt-1">
                {selectedOrder.items?.length > 0 ? (
                  selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-maroon-400" />
                        <span className="text-white font-medium">{item.product_name}</span>
                        <span className="text-zinc-500 font-mono">× {item.quantity}</span>
                      </div>
                      <span className="font-mono text-zinc-300 font-bold">{formatCurrency(item.line_total || item.price * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 italic">No item details recorded.</p>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-maroon-950/40 border border-maroon-800/30">
              <span className="font-bold text-white">Order Total Amount</span>
              <span className="font-mono font-extrabold text-sm text-emerald-400">{formatCurrency(selectedOrder.total)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
