"use client";

import React, { useState } from "react";
import { Template } from "@/types/admin";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Palette, Plus, Edit, Archive, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ThemeTableProps {
  templates: Template[];
  onCreateTemplate: (input: Omit<Template, "id" | "activeStoresCount">) => void;
}

export function ThemeTable({ templates, onCreateTemplate }: ThemeTableProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateTemplate({
      name: name.trim(),
      version: version.trim() || "v1.0",
      description: description.trim(),
      thumbnail: thumbnail.trim() || "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600",
      status: "active",
    });

    toast.success("Theme Created", `Added theme preset "${name}".`);
    setName("");
    setDescription("");
    setThumbnail("");
    setCreateOpen(false);
  };

  return (
    <div className="space-y-4 font-body">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Create New Theme Preset
        </Button>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-[#151515] border border-white/10 rounded-2xl p-4 space-y-3 font-body">
            <div className="flex items-center gap-3">
              <img src={t.thumbnail} alt={t.name} className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
              <div className="min-w-0 flex-1 text-left">
                <h5 className="font-bold font-heading text-white text-xs block truncate">{t.name}</h5>
                <span className="text-[10px] text-zinc-500 font-body block truncate">{t.description}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2 text-left">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Version</span>
                <span className="font-mono text-zinc-300 block text-[11px] mt-0.5">{t.version}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Active Usage</span>
                <span className="font-mono text-emerald-400 font-bold block text-[11px] mt-0.5">{t.activeStoresCount} Stores</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
              <Badge variant={t.status === "active" ? "success" : "outline"} className="capitalize text-[9px] px-1.5 py-0">
                {t.status}
              </Badge>
              <Button variant="outline" size="sm" className="h-7 text-[10px]">
                <Edit className="w-3 h-3 mr-1" /> Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-[#151515]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Theme Preset</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Active Merchants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={t.thumbnail} alt={t.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                    <div>
                      <h5 className="font-bold font-heading text-white">{t.name}</h5>
                      <span className="text-[11px] text-zinc-500 font-body line-clamp-1">{t.description}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-maroon-300">{t.version}</TableCell>
                <TableCell className="font-mono text-xs text-emerald-400 font-bold">{t.activeStoresCount} Stores</TableCell>
                <TableCell>
                  <Badge variant={t.status === "active" ? "success" : "outline"} className="capitalize text-[10px]">
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Theme Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Theme Preset" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-4 font-body">
          <Input label="Theme Name" placeholder="e.g. Royal Gold Edition" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Version" placeholder="v1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
          <Input label="Thumbnail Image URL" placeholder="https://..." value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">Description</label>
            <textarea
              rows={2}
              placeholder="Theme description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Theme</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
