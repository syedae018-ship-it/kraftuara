"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Settings,
  Save,
  Store,
  Globe,
  Phone,
  Mail,
  Loader2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Lock,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { appearanceRepository } from "@/lib/repositories/appearance-repository";
import { resolveImageUrl } from "@/lib/image-resolver";
import { PhoneInput } from "@/components/ui/phone-input";
import { normalizePhoneNumber, formatPhoneNumber, isValidPhoneNumber } from "@/lib/phone-utils";
import { toast } from "@/hooks/use-toast";

export default function MerchantSettingsPage() {
  const { activeStore, createStore } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Perfumes");
  const [logoUrl, setLogoUrl] = useState("");

  // WhatsApp Configuration State
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  
  // Shipping Configuration State
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | string>(0);
  const [shippingFee, setShippingFee] = useState<number | string>(50);
  const [isSavingShipping, setIsSavingShipping] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  useEffect(() => {
    if (activeStore) {
      setStoreName(activeStore.name);
      setSlug(activeStore.slug);
      setCategory(activeStore.category || "Perfumes");
      setLogoUrl(activeStore.logoUrl || "");

      async function loadStoreSettings() {
        if (!activeStore) return;
        setIsLoadingSettings(true);
        try {
          const settings = await appearanceRepository.getSettings(activeStore.id);
          if (settings?.branding) {
            setWhatsappNumber(settings.branding.whatsapp || "");
            setSupportPhone(settings.branding.phone || "");
            setSupportEmail(settings.branding.email || "");
          }
          const { getStoreShippingSettingsAction } = await import("@/lib/actions/store");
          const shipRes = await getStoreShippingSettingsAction(activeStore.id);
          if (shipRes.success && shipRes.data) {
            setFreeShippingEnabled(shipRes.data.freeShippingEnabled !== false);
            setFreeShippingThreshold(
              typeof shipRes.data.freeShippingThreshold === "number"
                ? shipRes.data.freeShippingThreshold
                : 0
            );
            setShippingFee(
              typeof shipRes.data.shippingFee === "number"
                ? shipRes.data.shippingFee
                : 50
            );
          }
        } catch (err) {
          console.error("Failed to load store settings:", err);
        } finally {
          setIsLoadingSettings(false);
        }
      }

      loadStoreSettings();
    }
  }, [activeStore?.id]);

  if (!activeStore) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Settings" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
        </div>
      </DashboardLayout>
    );
  }

  const normalizedWhatsAppDigits = normalizePhoneNumber(whatsappNumber);
  const isWhatsAppConfigured = Boolean(whatsappNumber.trim() && isValidPhoneNumber(normalizedWhatsAppDigits));

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedWhatsApp = whatsappNumber.trim() ? normalizePhoneNumber(whatsappNumber) : "";
    if (whatsappNumber.trim() && !isValidPhoneNumber(normalizedWhatsApp)) {
      toast.error(
        "Invalid WhatsApp Number",
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    const normalizedSupportPhone = supportPhone.trim() ? normalizePhoneNumber(supportPhone) : undefined;

    setIsSavingWhatsApp(true);
    try {
      await appearanceRepository.updateSettings(activeStore.id, {
        branding: {
          whatsapp: normalizedWhatsApp || undefined,
          phone: normalizedSupportPhone,
          email: supportEmail.trim() || undefined,
        },
      });

      toast.success(
        "WhatsApp Settings Saved",
        normalizedWhatsApp
          ? `Orders for ${activeStore.name} will now be sent to ${formatPhoneNumber(normalizedWhatsApp)}.`
          : "WhatsApp number removed. Customers will see a contact prompt on checkout."
      );
    } catch (err) {
      console.error(err);
      toast.error("Save Failed", "Could not save WhatsApp configuration.");
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  const handleClearWhatsApp = async () => {
    setWhatsappNumber("");
    setIsSavingWhatsApp(true);
    try {
      await appearanceRepository.updateSettings(activeStore.id, {
        branding: {
          whatsapp: undefined,
        },
      });
      toast.info("WhatsApp Removed", "WhatsApp ordering has been deactivated for this store.");
    } catch (err) {
      toast.error("Error", "Failed to clear WhatsApp number.");
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    try {
      let resolvedLogo = logoUrl.trim();
      if (resolvedLogo) {
        resolvedLogo = resolveImageUrl(resolvedLogo);
        // Validation check
        const checkImageLoad = (url: string): Promise<boolean> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
        };
        const isLoaded = await checkImageLoad(resolvedLogo);
        if (!isLoaded) {
          if (logoUrl.includes("drive.google.com")) {
            toast.error(
              "Private Google Drive Link",
              "The custom logo Google Drive file is private or requires authorization. Please make it publicly viewable."
            );
          } else if (logoUrl.includes("instagram.com")) {
            toast.error(
              "Private Instagram URL",
              "The custom logo Instagram post is private, invalid, or requires authentication."
            );
          } else {
            toast.error(
              "Invalid Logo URL",
              "The logo URL is private, invalid, or unsupported. Please check the link and ensure it is publicly accessible."
            );
          }
          setIsSavingGeneral(false);
          return;
        }
      }

      await createStore(storeName, slug, category, resolvedLogo || undefined, activeStore.primaryColor, activeStore.secondaryColor);
      toast.success("Settings Saved", "General store configurations updated successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error("Save Failed", err.message || "Failed to update settings.");
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingShipping(true);
    try {
      const thresholdNum = freeShippingThreshold === "" ? 0 : Number(freeShippingThreshold);
      const safeThreshold = isNaN(thresholdNum) || thresholdNum < 0 ? 0 : thresholdNum;

      const feeNum = shippingFee === "" ? 50 : Number(shippingFee);
      const safeFee = isNaN(feeNum) || feeNum < 0 ? 50 : feeNum;

      const { updateStoreShippingSettingsAction } = await import("@/lib/actions/store");
      const res = await updateStoreShippingSettingsAction(
        activeStore.id,
        freeShippingEnabled,
        safeThreshold,
        safeFee
      );
      if (res.success) {
        setFreeShippingThreshold(safeThreshold);
        setShippingFee(safeFee);
        toast.success("Shipping Settings Saved", "Shipping rates and free shipping threshold updated successfully.");
      } else {
        toast.error("Save Failed", res.error || "Could not save shipping configuration.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "An unexpected error occurred.");
    } finally {
      setIsSavingShipping(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Validation Error", "Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Validation Error", "New passwords do not match. Please verify.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Validation Error", "New password must be at least 6 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { changePasswordAction } = await import("@/lib/actions/auth");
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await changePasswordAction(formData);
      if (res.success) {
        toast.success("Password Updated", "Your account password has been updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Password Update Failed", res.error || "Failed to update password.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Settings" }]}>
      <div className="space-y-8 max-w-3xl text-left pb-16">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Store Configurations</h1>
          <p className="text-xs text-zinc-400 font-body mt-0.5">
            Manage your store identity, WhatsApp ordering channel, and contact details for{" "}
            <span className="text-white font-semibold">{activeStore.name}</span>.
          </p>
        </div>

        {/* 1. WhatsApp Ordering Configuration Card */}
        <Card className="bg-[#111111] border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-glow">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-heading text-white">WhatsApp Ordering Channel</h2>
                <p className="text-xs text-zinc-400 font-body">
                  Receive verified customer cart orders directly on WhatsApp.
                </p>
              </div>
            </div>

            <div>
              {isWhatsAppConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-xs font-mono font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Channel
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/50 text-xs font-mono font-semibold text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" /> Not Configured
                </span>
              )}
            </div>
          </div>

          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-8 text-zinc-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-maroon-400" /> Loading WhatsApp configurations...
            </div>
          ) : (
            <form onSubmit={handleSaveWhatsApp} className="space-y-4">
              <PhoneInput
                label="Store Owner WhatsApp Phone Number *"
                value={whatsappNumber}
                onChange={setWhatsappNumber}
                helperText="When customers click 'Order on WhatsApp', their complete formatted order will open in WhatsApp for this specific number."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <PhoneInput
                  label="Alternative Customer Support Phone"
                  value={supportPhone}
                  onChange={setSupportPhone}
                  placeholder="80000 12345"
                />
                <Input
                  label="Store Support Email"
                  placeholder="contact@yourstore.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="shadow-glow"
                    isLoading={isSavingWhatsApp}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save WhatsApp Number
                  </Button>

                  {isWhatsAppConfigured && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearWhatsApp}
                      className="border-red-900/40 text-red-400 hover:bg-red-950/20"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {isWhatsAppConfigured && (
                  <a
                    href={`https://wa.me/${normalizedWhatsAppDigits.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hello from ${activeStore.name}! This is a test message to verify store WhatsApp configuration.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test WhatsApp Link
                  </a>
                )}
              </div>
            </form>
          )}
        </Card>

        {/* 2. General Store Identity Card */}
        <Card className="bg-[#111111] border-white/10 p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-white/10">
            <h2 className="text-base font-bold font-heading text-white">General Store Identity</h2>
            <p className="text-xs text-zinc-400 font-body">Manage your store display name, slug, and branding.</p>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <Input
              label="Store Display Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              leftIcon={<Store className="w-4 h-4 text-zinc-500" />}
            />

            <div className="space-y-1">
              <Input
                label="Store Subdomain Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                required
                leftIcon={<Globe className="w-4 h-4 text-zinc-500" />}
              />
              <p className="text-[11px] text-zinc-400 font-mono">
                Live Store URL:{" "}
                <span className="text-amber-400 font-semibold">
                  https://{slug || "your-slug"}.kraftaura.in
                </span>
              </p>
            </div>

            <Input
              label="Category Preset"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 font-heading">Custom Logo URL</label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors font-medium hover:underline"
                    title="Remove custom logo URL"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Logo
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              {logoUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#151515] border border-white/5">
                  <img
                    src={resolveImageUrl(logoUrl)}
                    alt="Logo Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-black shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-zinc-400 font-mono block truncate">{logoUrl}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold font-body">Custom Logo Active</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors shrink-0"
                    title="Clear Logo URL"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="shadow-glow"
                isLoading={isSavingGeneral}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save General Settings
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Shipping Configuration Card */}
        <Card className="bg-[#111111] border-white/10 p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-white/10 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-maroon-950/80 border border-maroon-700/50 flex items-center justify-center text-maroon-400 shrink-0 shadow-glow">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white">Shipping Configuration</h2>
              <p className="text-xs text-zinc-400 font-body">Configure store-wide shipping rates and free shipping threshold.</p>
            </div>
          </div>

          <form onSubmit={handleSaveShipping} className="space-y-4 text-left">
            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="freeShippingEnabled"
                checked={freeShippingEnabled}
                onChange={(e) => setFreeShippingEnabled(e.target.checked)}
                className="w-3.5 h-3.5 accent-maroon-600 rounded bg-[#111111] border-white/10"
              />
              <label htmlFor="freeShippingEnabled" className="text-xs text-zinc-300 font-body cursor-pointer hover:text-white transition-colors font-semibold">
                Enable Free Shipping Promotion
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 font-heading block mb-1.5">
                  Standard Delivery Fee (₹) *
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 50"
                  value={shippingFee}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setShippingFee("");
                    } else {
                      const parsed = Number(val);
                      setShippingFee(isNaN(parsed) || parsed < 0 ? 0 : parsed);
                    }
                  }}
                  leftIcon={<span className="text-zinc-500 font-bold text-xs select-none">₹</span>}
                />
                <p className="text-[11px] text-zinc-500 font-body mt-1">
                  Charged to customers when order subtotal is below the free shipping threshold.
                </p>
              </div>

              {freeShippingEnabled && (
                <div>
                  <label className="text-xs font-semibold text-zinc-300 font-heading block mb-1.5">
                    Free Shipping Threshold (₹) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 0"
                    value={freeShippingThreshold}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setFreeShippingThreshold("");
                      } else {
                        const parsed = Number(val);
                        setFreeShippingThreshold(isNaN(parsed) || parsed < 0 ? 0 : parsed);
                      }
                    }}
                    leftIcon={<span className="text-zinc-500 font-bold text-xs select-none">₹</span>}
                  />
                  <p className="text-[11px] text-zinc-500 font-body mt-1">
                    Orders equal to or above this qualify for free shipping. Enter 0 for free shipping on all orders.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="shadow-glow"
                isLoading={isSavingShipping}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Shipping Settings
              </Button>
            </div>
          </form>
        </Card>

        {/* 4. Account Security & Password Card */}
        <Card className="bg-[#111111] border-white/10 p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-white/10 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-maroon-950/80 border border-maroon-700/50 flex items-center justify-center text-maroon-400 shrink-0 shadow-glow">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white">Account Security &amp; Password</h2>
              <p className="text-xs text-zinc-400 font-body">
                Update your account password. Supabase Auth manages your credentials securely.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-zinc-300 font-heading block mb-1.5">
                Current Password
              </label>
              <Input
                type="password"
                placeholder="Enter current password (if known)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4 text-zinc-500" />}
              />
              <p className="text-[11px] text-zinc-500 font-body mt-1">
                Leave blank if you signed in via a direct recovery session or OAuth.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 font-heading block mb-1.5">
                  New Password *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-zinc-500" />}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 font-heading block mb-1.5">
                  Confirm New Password *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<ShieldCheck className="w-4 h-4 text-zinc-500" />}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="shadow-glow"
                isLoading={isUpdatingPassword}
                disabled={isUpdatingPassword}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

