"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { UserTable } from "@/components/admin/user-table";
import { CreateUserModal } from "@/components/admin/create-user-modal";
import { AdminUser, AdminStore } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const u = await adminRepository.getUsers();
      setUsers(u);
    }
    loadData();
  }, []);

  const handleToggleUserStatus = async (id: string, current: AdminUser["status"]) => {
    const next = current === "active" ? "suspended" : "active";
    const updated = await adminRepository.updateUserStatus(id, next);
    setUsers(users.map((u) => (u.id === id ? updated : u)));
    toast.success("User Updated", `Merchant ${updated.name} status changed to ${next}.`);
  };

  const handleUserCreated = (newUser: AdminUser, newStore: AdminStore) => {
    setUsers([newUser, ...users]);
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="User & Merchant Management"
        description="Inspect, activate, suspend, or impersonate merchant user accounts across the platform."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Users className="w-3 h-3 text-maroon-300" /> {users.length} Registered Merchants
          </Badge>
        }
        action={
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
            Create New Merchant User
          </Button>
        }
      />

      <div className="pb-20">
        <UserTable users={users} onToggleStatus={handleToggleUserStatus} />
      </div>

      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </AdminLayout>
  );
}
