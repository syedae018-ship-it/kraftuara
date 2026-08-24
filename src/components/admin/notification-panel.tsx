"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Bell, Sparkles, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const notifications = [
    { title: "New Merchant Signup", desc: "Al Noor Organics signed up for Pro Plan.", time: "10m ago", icon: UserPlus },
    { title: "Creative Brief Submitted", desc: "Order CRV-9083 placed by Royal Fashion.", time: "45m ago", icon: Sparkles },
    { title: "Support Ticket Escalation", desc: "TCK-801 marked High Priority.", time: "2h ago", icon: AlertCircle },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Platform Notifications" maxWidth="md">
      <div className="space-y-3 font-body text-xs">
        {notifications.map((n, i) => {
          const Icon = n.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#111111] border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-maroon-950/60 border border-maroon-800/40 flex items-center justify-center text-maroon-400 shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <h5 className="font-bold font-heading text-white">{n.title}</h5>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{n.desc}</p>
                <span className="text-[10px] text-zinc-500 font-mono block pt-1">{n.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
