"use client";

import React, { useState, useEffect } from "react";
import { Designer } from "@/types/creative-mvp";
import { creativeMVPRepository } from "@/lib/repositories/creative-mvp-repository";
import { UserCheck, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DesignerPickerProps {
  selectedDesignerId?: string;
  onSelectDesigner: (designer: Designer) => void;
  className?: string;
}

export function DesignerPicker({ selectedDesignerId, onSelectDesigner, className }: DesignerPickerProps) {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadDesigners() {
      const list = await creativeMVPRepository.getDesigners();
      setDesigners(list);
    }
    loadDesigners();
  }, []);

  const selected = designers.find((d) => d.id === selectedDesignerId) || designers[0];

  return (
    <div className={cn("space-y-1.5 font-body", className)}>
      <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
        Assigned Designer
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 flex items-center justify-between text-xs text-white outline-none hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-2 truncate">
            <UserCheck className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
            <span className="font-semibold font-heading truncate">{selected?.name || "Select Designer"}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
        </button>

        {open && (
          <>
            <div onClick={() => setOpen(false)} className="fixed inset-0 z-40" />
            <div className="absolute left-0 right-0 top-11 z-50 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl space-y-1">
              {designers.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onSelectDesigner(d);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-bold font-heading text-white">{d.name}</p>
                    <p className="text-[10px] text-zinc-400">{d.role} ({d.activeOrdersCount} active)</p>
                  </div>
                  {selectedDesignerId === d.id && <Check className="w-3.5 h-3.5 text-maroon-400" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
