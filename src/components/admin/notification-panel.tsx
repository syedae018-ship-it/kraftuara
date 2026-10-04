"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Bell, CreditCard, Store, UserPlus, Loader2 } from "lucide-react";
import { adminRepository } from "@/lib/repositories/admin-repository";

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<
    { title: string; desc: string; time: string; icon: any }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([
      adminRepository.getPayments().catch(() => []),
      adminRepository.getStores().catch(() => []),
    ])
      .then(([payments, stores]) => {
        if (!isMounted) return;
        const list: { title: string; desc: string; time: string; icon: any }[] = [];

        // Real payment events
        const recentPayments = payments.slice(0, 3);
        for (const p of recentPayments) {
          list.push({
            title: "Subscription Payment Verified",
            desc: `${p.storeName ? `Store ${p.storeName}` : "Merchant"} • ₹${p.amount} (${p.planName || "SaaS Plan"})`,
            time: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent",
            icon: CreditCard,
          });
        }

        // Real store events
        const recentStores = stores.slice(0, 3);
        for (const s of recentStores) {
          list.push({
            title: "Store Created",
            desc: `${s.name} (${s.slug}.kraftaura.in) by ${s.ownerName || s.ownerEmail || "Merchant"}`,
            time: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent",
            icon: Store,
          });
        }

        setNotifications(list);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Platform Notifications" maxWidth="md">
      <div className="space-y-3 font-body text-xs">
        {loading ? (
          <div className="py-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-maroon-400" /> Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No recent platform activity or unread alerts.
          </div>
        ) : (
          notifications.map((n, i) => {
            const Icon = n.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#111111] border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-maroon-950/60 border border-maroon-800/40 flex items-center justify-center text-maroon-400 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5 text-left">
                  <h5 className="font-bold font-heading text-white">{n.title}</h5>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{n.desc}</p>
                  <span className="text-[10px] text-zinc-500 font-mono block pt-1">{n.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
