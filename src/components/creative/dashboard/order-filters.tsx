"use client";

import React from "react";
import { Search, LayoutGrid, List, SlidersHorizontal, Kanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface OrderFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (val: string) => void;
  viewMode: "services" | "table" | "kanban";
  onViewModeChange: (val: "services" | "table" | "kanban") => void;
  className?: string;
}

export function OrderFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  viewMode,
  onViewModeChange,
  className,
}: OrderFiltersProps) {
  return (
    <div className={cn("flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-[#151515] border border-white/10 rounded-2xl shadow-card", className)}>
      <div className="flex-1 min-w-[240px]">
        <Input
          placeholder="Search orders by number, title, or service..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="working">In Production</option>
          <option value="revision">Under Revision</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1 shrink-0 font-heading text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange("services")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1",
              viewMode === "services" ? "bg-maroon-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Catalog
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1",
              viewMode === "table" ? "bg-maroon-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
          >
            <List className="w-3.5 h-3.5" /> Orders
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1",
              viewMode === "kanban" ? "bg-maroon-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
          >
            <Kanban className="w-3.5 h-3.5" /> Kanban
          </button>
        </div>
      </div>
    </div>
  );
}
