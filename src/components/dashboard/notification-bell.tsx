"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Sparkles, ShoppingBag, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "order" | "creative" | "system";
};

const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "New Catalog Order",
    message: "Order #1092 placed for Aroma Royal Oud (₹1,499.00)",
    time: "5m ago",
    read: false,
    type: "order",
  },
  {
    id: "n2",
    title: "Creative Banner Ready",
    message: "Your requested Eid Promotion Banners have been uploaded.",
    time: "1h ago",
    read: false,
    type: "creative",
  },
  {
    id: "n3",
    title: "Domain Verification",
    message: "Custom domain aroma-perfumes.com connected successfully.",
    time: "1d ago",
    read: true,
    type: "system",
  },
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-maroon-500 ring-2 ring-[#080808] animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Notification Popover */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#111111]">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold font-heading text-white tracking-wide">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-maroon-800 text-white font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-maroon-400 hover:text-maroon-300 font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 font-body">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3.5 flex items-start gap-3 transition-colors group relative",
                        !item.read ? "bg-maroon-950/20" : "hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        {item.type === "order" ? (
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        ) : item.type === "creative" ? (
                          <Sparkles className="w-3.5 h-3.5 text-maroon-400" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-semibold font-heading text-white truncate">
                            {item.title}
                          </h5>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-body mt-0.5 leading-relaxed">
                          {item.message}
                        </p>
                      </div>

                      <button
                        onClick={() => removeNotification(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity p-1"
                        aria-label="Remove notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
