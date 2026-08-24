"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminStore } from "@/types/admin";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Store, ExternalLink, Eye, Package, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getStoreUrl } from "@/lib/urls";

export interface StoreTableProps {
  stores: AdminStore[];
  onToggleStatus: (storeId: string, currentStatus: AdminStore["status"]) => void;
}

export function StoreTable({ stores, onToggleStatus }: StoreTableProps) {
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Storefront</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Catalog Items</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Active Theme</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-maroon-950/60 border border-maroon-800/40 flex items-center justify-center text-maroon-400 font-bold font-heading text-xs shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold font-heading text-white">{s.name}</h5>
                      <span className="text-[11px] text-zinc-500 font-mono">{s.slug}.platform.com</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-white text-xs">{s.ownerName}</p>
                    <span className="text-[10px] text-zinc-500 font-mono">{s.ownerEmail}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-300">
                  {s.productCount} Products
                </TableCell>
                <TableCell>
                  <Badge variant="maroon" className="font-mono text-[10px]">
                    {s.plan}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-zinc-400 font-heading">
                  {s.themeName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={s.status === "live" ? "success" : s.status === "draft" ? "outline" : "error"}
                    className="capitalize text-[10px]"
                  >
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setSelectedStore(s)}>
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Button>
                    <Link href={getStoreUrl(s.slug)} target="_blank">
                      <Button variant="ghost" size="sm" title="Visit Storefront">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Store Details Modal */}
      {selectedStore && (
        <Modal
          isOpen={Boolean(selectedStore)}
          onClose={() => setSelectedStore(null)}
          title={`Store Overview: ${selectedStore.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 font-body text-xs">
            <div className="bg-[#111111] p-4 rounded-xl border border-white/10 grid grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Store Subdomain</span>
                <span className="font-bold text-white font-mono">{selectedStore.slug}.platform.com</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Store Owner</span>
                <span className="font-semibold text-white">{selectedStore.ownerName} ({selectedStore.ownerEmail})</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Total Catalog Items</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedStore.productCount} Products</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Active Theme</span>
                <span className="font-heading text-white">{selectedStore.themeName}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant={selectedStore.status === "live" ? "danger" : "primary"}
                size="sm"
                onClick={() => {
                  onToggleStatus(selectedStore.id, selectedStore.status);
                  setSelectedStore(null);
                }}
              >
                {selectedStore.status === "live" ? "Suspend Storefront" : "Activate Storefront"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
