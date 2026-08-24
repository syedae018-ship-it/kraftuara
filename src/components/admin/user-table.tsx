"use client";

import React from "react";
import Link from "next/link";
import { AdminUser } from "@/types/admin";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { LogIn, Eye, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface UserTableProps {
  users: AdminUser[];
  onToggleStatus: (userId: string, currentStatus: AdminUser["status"]) => void;
}

export function UserTable({ users, onToggleStatus }: UserTableProps) {
  const { impersonate } = useAuth();

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
              <div className="min-w-0 flex-1">
                <Link href={`/admin/users/${u.id}`} className="font-bold font-heading text-white hover:text-maroon-300 transition-colors block truncate text-xs">
                  {u.name}
                </Link>
                <span className="text-[10px] text-zinc-500 font-mono block truncate">{u.email}</span>
              </div>
              <Badge variant={u.status === "active" ? "success" : "error"} className="capitalize text-[9px] shrink-0">
                {u.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Plan</span>
                <Badge variant="maroon" className="font-mono text-[9px] mt-0.5 px-1.5 py-0">
                  {u.plan}
                </Badge>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Store</span>
                <Link href={`/store/${u.storeSlug}`} target="_blank" className="hover:text-maroon-300 font-semibold transition-colors block mt-0.5 truncate text-[11px]">
                  {u.storeName}
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[10px]">
              <span className="font-mono text-zinc-500">
                Joined {new Date(u.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-1">
                <Link href={`/admin/users/${u.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2" title="View Specs & Details">
                    <Eye className="w-3 h-3" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[10px]"
                  onClick={() => impersonate(u)}
                >
                  <LogIn className="w-3 h-3 mr-1" /> Impersonate
                </Button>
                <Button
                  variant={u.status === "active" ? "ghost" : "primary"}
                  size="sm"
                  className="h-7 px-2.5 text-[10px]"
                  onClick={() => onToggleStatus(u.id, u.status)}
                >
                  {u.status === "active" ? "Suspend" : "Activate"}
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
                    <div>
                      <Link href={`/admin/users/${u.id}`} className="font-bold font-heading text-white hover:text-maroon-300 transition-colors">
                        {u.name}
                      </Link>
                      <span className="text-[11px] text-zinc-500 font-mono block">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="maroon" className="font-mono text-[10px]">
                    {u.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/store/${u.storeSlug}`} target="_blank" className="hover:text-maroon-300 font-semibold transition-colors">
                    {u.storeName}
                  </Link>
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
                    <Link href={`/admin/users/${u.id}`}>
                      <Button variant="ghost" size="sm" title="View Specs & Details">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => impersonate(u)}
                      title="Open Dashboard as Merchant"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Impersonate
                    </Button>
                    <Button
                      variant={u.status === "active" ? "ghost" : "primary"}
                      size="sm"
                      onClick={() => onToggleStatus(u.id, u.status)}
                    >
                      {u.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
