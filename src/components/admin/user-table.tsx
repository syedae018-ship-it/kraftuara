"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminUser } from "@/types/admin";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/auth-context";
import { LogIn, Eye, Trash2, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deleteUserAccountAction } from "@/lib/actions/admin";
import { getPlanDisplayName } from "@/lib/feature-gating";

export interface UserTableProps {
  users: AdminUser[];
  onToggleStatus: (userId: string, currentStatus: AdminUser["status"]) => void;
  onUserDeleted?: (userId: string) => void;
}

export function UserTable({ users, onToggleStatus, onUserDeleted }: UserTableProps) {
  const { impersonate } = useAuth();
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUserAccountAction(userToDelete.id);
      if (res.success) {
        toast.success("User Deleted", `Account ${userToDelete.email} permanently removed.`);
        onUserDeleted?.(userToDelete.id);
        setUserToDelete(null);
      } else {
        toast.error("Delete Failed", res.error || "Could not delete user account.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to delete user account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    onToggleStatus(suspendTarget.id, suspendTarget.status);
    setSuspendTarget(null);
  };

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 p-12 text-center bg-[#151515] font-body text-zinc-500">
        <p className="text-sm font-semibold">No registered merchant accounts found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {users.map((u) => (
          <div key={u.id} className="bg-[#151515] border border-white/10 rounded-2xl p-4 space-y-3 font-body">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-maroon-950/60 border border-maroon-800/40 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <span className="font-bold font-heading text-white block truncate text-xs">
                  {u.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block truncate">{u.email}</span>
              </div>
              <Badge variant={u.status === "active" ? "success" : "error"} className="capitalize text-[9px] shrink-0">
                {u.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2 text-left">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Plan</span>
                <Badge variant="maroon" className="font-mono text-[9px] mt-0.5 px-1.5 py-0">
                  {getPlanDisplayName(u.plan)}
                </Badge>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Store</span>
                <span className="font-semibold text-white block mt-0.5 truncate text-[11px]">
                  {u.storeName}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[10px]">
              <span className="font-mono text-zinc-500">
                Joined {new Date(u.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => impersonate(u)}
                >
                  <LogIn className="w-3 h-3 mr-1" /> Impersonate
                </Button>
                <Button
                  variant={u.status === "active" ? "ghost" : "primary"}
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => (u.status === "active" ? setSuspendTarget(u) : onToggleStatus(u.id, u.status))}
                >
                  {u.status === "active" ? "Suspend" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                  onClick={() => setUserToDelete(u)}
                  title="Delete Account"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Merchant</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-maroon-950/60 border border-maroon-800/40 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <span className="font-bold font-heading text-white block">
                        {u.name}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono block">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="maroon" className="font-mono text-[10px]">
                    {getPlanDisplayName(u.plan)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-white">
                    {u.storeName}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-zinc-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === "active" ? "success" : "error"} className="capitalize text-[10px]">
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => impersonate(u)}
                      title="Open Dashboard as Merchant"
                      className="text-xs"
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1" /> Impersonate
                    </Button>
                    <Button
                      variant={u.status === "active" ? "ghost" : "primary"}
                      size="sm"
                      onClick={() => (u.status === "active" ? setSuspendTarget(u) : onToggleStatus(u.id, u.status))}
                      className="text-xs"
                    >
                      {u.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                      onClick={() => setUserToDelete(u)}
                      title="Delete User Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Suspend Confirmation Modal */}
      {suspendTarget && (
        <Modal
          isOpen={true}
          onClose={() => setSuspendTarget(null)}
          title="Suspend Merchant Account?"
          description={`Suspending ${suspendTarget.name} (${suspendTarget.email}) will block merchant dashboard login and disable their live storefront.`}
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>You can unsuspend this merchant account anytime to restore access and their storefront.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSuspendTarget(null)}>Cancel</Button>
              <Button variant="primary" className="bg-amber-600 hover:bg-amber-500 text-black font-bold" onClick={handleConfirmSuspend}>
                Suspend Account
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setUserToDelete(null)}
          title="Delete Merchant Account Permanently?"
          description={`This action permanently removes the user account (${userToDelete.email}) and cascades deletion to all associated stores.`}
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>Warning: This cannot be undone. All stores and product catalogs for this user will be removed.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setUserToDelete(null)}>Cancel</Button>
              <Button variant="primary" className="bg-rose-600 hover:bg-rose-500 font-bold" isLoading={isDeleting} onClick={handleDeleteUser}>
                Permanently Delete Account
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
