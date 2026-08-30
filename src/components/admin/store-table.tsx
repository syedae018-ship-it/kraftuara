"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminStore } from "@/types/admin";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Store, ExternalLink, Eye, Trash2, AlertTriangle, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getStoreUrl } from "@/lib/urls";
import { deleteStoreAction } from "@/lib/actions/admin";
import { getPlanDisplayName } from "@/lib/feature-gating";

export interface StoreTableProps {
  stores: AdminStore[];
  onToggleStatus: (storeId: string, currentStatus: AdminStore["status"]) => void;
  onStoreDeleted?: (storeId: string) => void;
}

export function StoreTable({ stores, onToggleStatus, onStoreDeleted }: StoreTableProps) {
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<AdminStore | null>(null);
  const [confirmNameInput, setConfirmNameInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    if (confirmNameInput.trim().toLowerCase() !== storeToDelete.name.trim().toLowerCase()) {
      toast.error("Name Mismatch", "Please type the exact store name to confirm deletion.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteStoreAction(storeToDelete.id);
      if (res.success) {
        toast.success("Store Deleted", `Store "${storeToDelete.name}" permanently removed.`);
        onStoreDeleted?.(storeToDelete.id);
        setStoreToDelete(null);
        setConfirmNameInput("");
      } else {
        toast.error("Delete Failed", res.error || "Could not delete store.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to delete store.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (stores.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 p-12 text-center bg-[#151515] font-body text-zinc-500">
        <p className="text-sm font-semibold">No multi-tenant merchant stores created yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {stores.map((s) => {
          const storeUrl = getStoreUrl(s.slug);
          return (
            <div key={s.id} className="bg-[#151515] border border-white/10 rounded-2xl p-4 space-y-3 font-body">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-maroon-950/60 border border-maroon-800/40 flex items-center justify-center text-maroon-400 font-bold font-heading text-xs shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h5 className="font-bold font-heading text-white text-xs block truncate">{s.name}</h5>
                  <span className="text-[10px] text-zinc-500 font-mono block truncate">{storeUrl}</span>
                </div>
                <Badge
                  variant={s.status === "live" ? "success" : s.status === "draft" ? "outline" : "error"}
                  className="capitalize text-[9px] shrink-0"
                >
                  {s.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2 text-left">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Owner</span>
                  <span className="font-semibold text-white block truncate text-[11px] mt-0.5">{s.ownerName}</span>
                  <span className="text-[9px] text-zinc-500 font-mono block truncate">{s.ownerEmail}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Catalog</span>
                  <span className="font-mono text-zinc-300 font-bold block text-[11px] mt-0.5">{s.productCount} Products</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2 text-left">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Plan</span>
                  <Badge variant="maroon" className="font-mono text-[9px] mt-0.5 px-1.5 py-0">
                    {getPlanDisplayName(s.plan)}
                  </Badge>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Theme</span>
                  <span className="text-zinc-400 font-heading text-[11px] block mt-0.5 truncate">{s.themeName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                <span className="font-mono text-zinc-500 text-[10px]">
                  Created {new Date(s.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedStore(s)}>
                    <Eye className="w-3 h-3 mr-1" /> Details
                  </Button>
                  <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-7 px-2" title="Visit Storefront">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                    onClick={() => setStoreToDelete(s)}
                    title="Delete Store"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body">
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
            {stores.map((s) => {
              const storeUrl = getStoreUrl(s.slug);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-maroon-950/60 border border-maroon-800/40 flex items-center justify-center text-maroon-400 font-bold font-heading text-xs shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-heading text-white">{s.name}</span>
                          <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors" title="Open Storefront">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono block">{storeUrl}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-left">
                      <span className="font-medium text-white text-xs block">{s.ownerName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono block">{s.ownerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300 text-xs font-bold">
                    {s.productCount} Products
                  </TableCell>
                  <TableCell>
                    <Badge variant="maroon" className="font-mono text-[10px]">
                      {getPlanDisplayName(s.plan)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 font-heading text-xs">
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
                      <Button variant="outline" size="sm" onClick={() => setSelectedStore(s)} className="text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Details
                      </Button>
                      <Button
                        variant={s.status === "live" ? "ghost" : "primary"}
                        size="sm"
                        onClick={() => onToggleStatus(s.id, s.status)}
                        className="text-xs"
                      >
                        {s.status === "live" ? "Suspend" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                        onClick={() => setStoreToDelete(s)}
                        title="Delete Store Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Store Details Modal */}
      {selectedStore && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStore(null)}
          title={`Store: ${selectedStore.name}`}
          description="Detailed multi-tenant storefront configuration."
        >
          <div className="space-y-4 pt-2 font-body text-xs text-left">
            <div className="p-4 rounded-xl bg-[#111111] border border-white/5 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Store Slug</span>
                <span className="font-mono text-white">{selectedStore.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Live URL</span>
                <a href={getStoreUrl(selectedStore.slug)} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-mono truncate max-w-[200px]">
                  {getStoreUrl(selectedStore.slug)}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Owner Name</span>
                <span className="text-white">{selectedStore.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Owner Email</span>
                <span className="font-mono text-white">{selectedStore.ownerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Active Tier</span>
                <span className="font-bold text-maroon-300">{selectedStore.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Catalog Count</span>
                <span className="font-mono text-white">{selectedStore.productCount} Items</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedStore(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Store Confirmation Modal */}
      {storeToDelete && (
        <Modal
          isOpen={true}
          onClose={() => {
            setStoreToDelete(null);
            setConfirmNameInput("");
          }}
          title="Permanently Delete Storefront?"
          description={`This action permanently deletes "${storeToDelete.name}" and removes all associated products, categories, collections, and settings.`}
        >
          <div className="space-y-4 pt-2 text-left">
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>To confirm, please type the exact store name: <strong className="text-white font-mono">{storeToDelete.name}</strong></span>
            </div>

            <Input
              value={confirmNameInput}
              onChange={(e) => setConfirmNameInput(e.target.value)}
              placeholder={storeToDelete.name}
              className="font-mono text-xs"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setStoreToDelete(null);
                  setConfirmNameInput("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-rose-600 hover:bg-rose-500 font-bold"
                disabled={confirmNameInput.trim().toLowerCase() !== storeToDelete.name.trim().toLowerCase()}
                isLoading={isDeleting}
                onClick={handleDeleteStore}
              >
                Delete Store
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
