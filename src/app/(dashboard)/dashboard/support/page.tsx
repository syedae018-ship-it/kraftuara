"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HelpCircle, Send, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function MerchantSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Ticket Submitted", "Our SaaS support team will respond shortly.");
      setSubject("");
      setMessage("");
      setSubmitting(false);
    }, 800);
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Support" }]}>
      <div className="space-y-6 text-left max-w-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Merchant Support</h1>
          <p className="text-xs text-zinc-400 font-body">Contact customer service and review support requests.</p>
        </div>

        <Card className="bg-[#111111] border-white/10 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="e.g. Setting up custom payment gateways"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-heading block">
                Message Detail
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Describe your issue or custom setup request..."
                className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-xs font-body text-white placeholder-zinc-500 focus:outline-none focus:border-maroon-600/80 transition-colors"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" isLoading={submitting} className="shadow-glow" leftIcon={<Send className="w-4 h-4" />}>
                Submit Support Request
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
