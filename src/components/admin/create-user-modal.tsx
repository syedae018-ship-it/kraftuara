"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Sparkles, Store, Mail, Phone, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdminUser, AdminStore } from "@/types/admin";
import { PLANS, PlanConfig } from "@/lib/feature-gating";

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: AdminUser, store: AdminStore) => void;
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [businessName, setBusinessName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("Perfumes");
  const [plan, setPlan] = useState("startup");
  const [theme, setTheme] = useState("Luxury Oud Dark");
  const [subdomain, setSubdomain] = useState("");
  const [status, setStatus] = useState<"active" | "suspended" | "pending">("active");
  const [plans, setPlans] = useState<PlanConfig[]>([]);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPlans(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const effectivePlans = plans.length > 0 ? plans : Object.values(PLANS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !storeName.trim()) {
      toast.error("Required Fields Missing", "Please enter full name, email, and store name.");
      return;
    }

    const slug = subdomain.trim() || storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const userId = `usr-${Date.now()}`;
    const storeId = `str-${Date.now()}`;

    const newUser: AdminUser = {
      id: userId,
      name: fullName.trim(),
      email: email.trim(),
      plan,
      storeName: storeName.trim(),
      storeSlug: slug,
      createdAt: new Date().toISOString(),
      status,
    };

    const newStore: AdminStore = {
      id: storeId,
      name: storeName.trim(),
      slug,
      ownerName: fullName.trim(),
      ownerEmail: email.trim(),
      productCount: 12,
      plan,
      status: "live",
      themeName: theme,
      createdAt: new Date().toISOString(),
    };

    onUserCreated(newUser, newStore);
    toast.success("Merchant Created", `Generated profile, store, categories, and products for ${storeName.trim()}.`);
    onClose();

    // Reset form
    setFullName("");
    setEmail("");
    setStoreName("");
    setSubdomain("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Merchant User & Store"
      description="Generates complete profile, store settings, categories, collections, and catalog items."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Full Name" placeholder="e.g. Tariq Al-Mansoor" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Email Address" type="email" placeholder="tariq@perfumes.me" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Phone Number" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Business Legal Name" placeholder="e.g. Al Mansoor Perfumeries Ltd." value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Storefront Name"
            placeholder="e.g. Tariq Attars"
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value);
              if (!subdomain) {
                setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }
            }}
            required
          />
          <Input label="Subdomain Slug" placeholder="tariq-attars" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">Business Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value="Perfumes">Perfumes & Oud</option>
              <option value="Clothing">Fashion & Clothing</option>
              <option value="Jewelry">Jewelry & Watches</option>
              <option value="Electronics">Electronics</option>
              <option value="Organic">Organic & Beauty</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">Plan Tier</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
            >
              {effectivePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.priceMonthly}/mo)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">Active Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value="Luxury Oud Dark">Luxury Oud Dark</option>
              <option value="Minimal Pure">Minimal Pure</option>
              <option value="Fashion Elegance">Fashion Elegance</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
            Create User & Seed Store
          </Button>
        </div>
      </form>
    </Modal>
  );
}
