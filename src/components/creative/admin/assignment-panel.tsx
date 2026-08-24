"use client";

import React, { useState, useEffect } from "react";
import { Assignment } from "@/types/creative-mvp";
import { CreativeStatus, PriorityLevel } from "@/types/creative";
import { creativeMVPRepository } from "@/lib/repositories/creative-mvp-repository";
import { DesignerPicker } from "./designer-picker";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Save, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface AssignmentPanelProps {
  orderId: string;
  onAssignmentUpdated?: () => void;
  className?: string;
}

export function AssignmentPanel({ orderId, onAssignmentUpdated, className }: AssignmentPanelProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAssignment = async () => {
    const data = await creativeMVPRepository.getAssignment(orderId);
    setAssignment(data);
  };

  useEffect(() => {
    fetchAssignment();
  }, [orderId]);

  const handleSave = async () => {
    if (!assignment) return;
    setIsSaving(true);

    await creativeMVPRepository.updateAssignment(orderId, assignment);
    toast.success("Admin Assignment Saved", "Updated order controls and designer assignment.");
    setIsSaving(false);
    onAssignmentUpdated?.();
  };

  if (!assignment) return null;

  return (
    <Card className={cn("p-5 space-y-4 bg-[#151515] border-white/10 font-body", className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-maroon-400" />
          <h4 className="text-xs font-bold font-heading text-white">Admin Order Controls</h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Internal</span>
      </div>

      <DesignerPicker
        selectedDesignerId={assignment.designerId}
        onSelectDesigner={(d) => setAssignment({ ...assignment, designerId: d.id, designerName: d.name })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-heading">Order Status</label>
          <select
            value={assignment.status}
            onChange={(e) => setAssignment({ ...assignment, status: e.target.value as CreativeStatus })}
            className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="working">In Production</option>
            <option value="revision">Under Revision</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-heading">Priority Level</label>
          <select
            value={assignment.priority}
            onChange={(e) => setAssignment({ ...assignment, priority: e.target.value as PriorityLevel })}
            className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>
        </div>
      </div>

      <Input
        label="Due Date Target"
        type="date"
        value={assignment.dueDate}
        onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300 font-heading">Internal Designer Notes</label>
        <textarea
          rows={2}
          placeholder="Private notes visible only to production team..."
          value={assignment.internalNotes || ""}
          onChange={(e) => setAssignment({ ...assignment, internalNotes: e.target.value })}
          className="w-full bg-[#111111] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-zinc-600 outline-none resize-none"
        />
      </div>

      <Button
        variant="primary"
        size="sm"
        className="w-full font-semibold"
        onClick={handleSave}
        isLoading={isSaving}
        leftIcon={<Save className="w-3.5 h-3.5" />}
      >
        Update Assignment & Status
      </Button>
    </Card>
  );
}
