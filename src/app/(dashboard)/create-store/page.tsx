"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  ExternalLink,
  Globe,
  Palette,
  Type,
  X,
  Phone,
  Mail,
  MapPin,
  Instagram,
  ShoppingBag,
  Package,
  Plus,
} from "lucide-react";
import { getStoreUrl, normalizeSlug } from "@/lib/urls";
import { Button } from "@/components/ui/button";

const SUPPORTED_FONTS = [
  "Helvetica Neue",
  "Poppins",
  "Inter",
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "DM Sans",
  "Manrope",
  "Plus Jakarta Sans",
  "Archivo",
  "Oswald",
  "Impact",
  "Playfair Display",
  "Space Grotesk",
];

const fontStacks: Record<string, string> = {
  "Helvetica Neue": '"Helvetica Neue", Helvetica, Arial, sans-serif',
  "Poppins": '"Poppins", sans-serif',
  "Inter": '"Inter", sans-serif',
  "Montserrat": '"Montserrat", sans-serif',
  "Roboto": '"Roboto", sans-serif',
  "Open Sans": '"Open Sans", sans-serif',
  "Lato": '"Lato", sans-serif',
  "DM Sans": '"DM Sans", sans-serif',
  "Manrope": '"Manrope", sans-serif',
  "Plus Jakarta Sans": '"Plus Jakarta Sans", sans-serif',
  "Archivo": '"Archivo", sans-serif',
  "Oswald": '"Oswald", sans-serif',
  "Impact": 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  "Playfair Display": '"Playfair Display", serif',
  "Space Grotesk": '"Space Grotesk", sans-serif',
};

const getFontStack = (font: string) => {
  return fontStacks[font] || `"${font}", sans-serif`;
};
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const categories = [
  { id: "Perfumes", label: "Perfumes & Attars", desc: "Fragrances, Attar Oils & Bakhoor" },
  { id: "Electronics", label: "Electronics & Tech", desc: "Gadgets, Audio & Accessories" },
  { id: "Clothing", label: "Fashion & Lifestyle", desc: "Streetwear, Apparel & Boutique" },
  { id: "Jewelry", label: "Jewelry & Gold", desc: "Rings, Chains & Ornaments" },
  { id: "Beauty", label: "Beauty & Cosmetics", desc: "Skincare, Makeup & Care" },
  { id: "General", label: "General Store", desc: "Multi-category catalog" },
];

export default function CreateStoreWizard() {
  const router = useRouter();
  const { user, activeStore, completeStoreWizard } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Wizard Form State
  const [storeName, setStoreName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [category, setCategory] = useState("Clothing");

  // Branding (logo only — colors/fonts set via Appearance page after creation)
  const [logoUrl, setLogoUrl] = useState("");

  // Contact & Social (no dummy defaults — must be filled in by merchant)
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [supportEmail, setSupportEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  const previewSlug = normalizeSlug(storeName);

  const handleNextStep = () => {
    if (step === 1 && !storeName.trim()) {
      toast.error("Store Name Required", "Please enter a valid store name.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinishSetup = async () => {
    if (loading) return;
    const cleanSlug = normalizeSlug(storeName);
    if (!cleanSlug || cleanSlug.length < 3) {
      toast.error("Invalid Store Name", "Please enter a valid store name (at least 3 characters).");
      return;
    }
    setLoading(true);
    try {
      await completeStoreWizard({
        storeName,
        category,
        logoUrl,
        tagline,
        aboutText,
        whatsapp,
        phone,
        email: supportEmail,
        address,
        instagram,
        facebook,
        logoFile,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      toast.error("Setup Error", err.message || "Failed to finalize store setup.");
    } finally {
      setLoading(false);
    }
  };

  const generatedStoreUrl = getStoreUrl(activeStore?.slug || previewSlug);

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(generatedStoreUrl);
    toast.success("Link Copied!", "Store URL copied to clipboard.");
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 sm:p-6 lg:p-8 font-body relative overflow-hidden">
      {/* Glow backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-maroon-900/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white shadow-glow">
              <Store className="w-5 h-5 text-maroon-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-white tracking-tight">
                Store Creation Wizard
              </h1>
              <p className="text-xs text-zinc-400">
                Step {step} of 3 • Set up your store identity, contact details, and go live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="maroon" className="text-[10px] font-mono uppercase tracking-wider">
              Step {step}/3 Active
            </Badge>
          </div>
        </div>

        {/* Wizard Main Grid: Left Inputs vs Right Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Multi-Step Input Controls (7 cols) */}
          <div className="lg:col-span-5 space-y-6 bg-[#111111] border border-white/10 p-6 rounded-3xl shadow-2xl">
            {/* Step Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 border border-white/5 rounded-2xl">
              {[
                { num: 1, label: "Info" },
                { num: 2, label: "Contact" },
                { num: 3, label: "Launch" },
              ].map((s) => (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className={cn(
                    "py-1.5 px-2 rounded-xl text-[11px] font-bold font-heading uppercase transition-all",
                    step === s.num
                      ? "bg-maroon-800 text-white shadow-glow"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* STEP 1: Basic Store Info */}
            {step === 1 && (
              <div className="space-y-4 text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-maroon-400 font-heading">
                  1. Store & Business Identity
                </h3>

                <div className="space-y-1.5">
                  <Input
                    label="Store Name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Aroma Perfumes"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="Legal Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Aroma Perfumes Private Limited"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium block">
                    Store URL (Automatically Generated)
                  </label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-400 overflow-hidden">
                    <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="text-emerald-400 font-bold truncate">
                      {getStoreUrl(previewSlug || "your-slug")}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    This URL is automatically generated from your store name.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="Store Tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Premium oud & luxury fragrances."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium block">
                    Business Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-maroon-500 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.desc})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium block">
                    About Business Description
                  </label>
                  <textarea
                    rows={3}
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    placeholder="Tell your brand story..."
                    className="w-full bg-[#181818] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-maroon-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Contact & Business Operations */}
            {step === 2 && (
              <div className="space-y-4 text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-maroon-400 font-heading">
                  2. Contact & Business Information
                </h3>

                <div className="space-y-1.5">
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    leftIcon={<Phone className="w-4 h-4 text-zinc-500" />}
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="WhatsApp Business Number"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+91 98765 43210"
                    leftIcon={<Phone className="w-4 h-4 text-emerald-400" />}
                  />
                  <p className="text-[10px] text-zinc-500 font-mono">
                    This is the number customers will WhatsApp their orders to.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="Customer Support Email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@aroma.com"
                    leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="Physical Business Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. MG Road, Mumbai"
                    leftIcon={<MapPin className="w-4 h-4 text-zinc-500" />}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Instagram Handle"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@aroma_perfumes"
                  />
                  <Input
                    label="Facebook Page"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/..."
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Launch (was Step 4) */}
            {step === 3 && (
              <div className="space-y-4 text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-maroon-400 font-heading">
                  3. Launch Your Store
                </h3>

                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ready to Go Live
                  </div>
                  <p className="text-[11px] text-emerald-400/80">
                    Click &quot;Finish Setup &amp; Generate Store&quot; to create your live storefront. You can customise colors, fonts, and branding from the Appearance page after launch.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-zinc-400">
                  <p className="font-semibold text-zinc-200">What happens next:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Your store goes live at <span className="text-emerald-400 font-mono">/store/{previewSlug || "your-slug"}</span></li>
                    <li>Add products from the Products dashboard</li>
                    <li>Customise colors &amp; fonts from the Appearance page</li>
                    <li>Set up WhatsApp ordering so customers can place orders</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevStep}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  className="border-white/10"
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="shadow-glow"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFinishSetup}
                  isLoading={loading}
                  rightIcon={<Sparkles className="w-4 h-4" />}
                  className="shadow-glow font-bold"
                >
                  Finish Setup &amp; Generate Store
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Side-by-Side Live Responsive Preview Window (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Device Switcher Header */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-white">
                <Sparkles className="w-4 h-4 text-maroon-400" />
                <span>Live Storefront Engine Preview</span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                    previewDevice === "desktop"
                      ? "bg-maroon-800 text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  )}
                  title="Desktop View (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice("tablet")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                    previewDevice === "tablet"
                      ? "bg-maroon-800 text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  )}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                    previewDevice === "mobile"
                      ? "bg-maroon-800 text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  )}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Preview Frame Canvas */}
            <div className="w-full flex justify-center bg-[#050505] border border-white/10 rounded-3xl p-4 min-h-[560px] overflow-hidden shadow-2xl">
              <div
                className={cn(
                  "bg-white border border-white/10 rounded-2xl overflow-y-auto transition-all duration-300 flex flex-col justify-between text-left shadow-2xl relative",
                  previewDevice === "desktop" && "w-full min-h-[540px]",
                  previewDevice === "tablet" && "w-[520px] min-h-[540px]",
                  previewDevice === "mobile" && "w-[320px] min-h-[540px]"
                )}
              >
                {/* 1. Preview Announcement Bar */}
                <div className="py-1.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-white bg-black">
                  Free delivery on orders above ₹999
                </div>

                {/* 2. Preview Store Header */}
                <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-black text-white font-bold text-xs">
                        {storeName.charAt(0) || "S"}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">{storeName || "Your Store"}</h4>
                      <span className="text-[9px] font-mono text-zinc-500 block -mt-0.5">{category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 text-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>

                {/* 3. Preview Hero Section */}
                <div className="p-6 space-y-4 text-center border-b border-zinc-100 bg-zinc-50">
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-black text-black inline-block">
                    Official Storefront
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                    {tagline || "Discover Premium Curation"}
                  </h2>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto line-clamp-2">
                    {aboutText || "High-quality products curated for you."}
                  </p>
                  <button className="px-4 py-2 text-xs font-bold uppercase text-white shadow-md rounded-xl mx-auto block bg-black">
                    Explore Products
                  </button>
                </div>

                {/* 4. Preview Products Grid */}
                <div className="p-4 space-y-3 flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Featured Items
                  </span>
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-300 rounded-xl text-center space-y-2">
                    <Package className="w-8 h-8 text-zinc-300 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-400">No products yet</span>
                    <span className="text-[9px] text-zinc-400 max-w-[180px]">
                      Add your first product from the Products page after launch.
                    </span>
                  </div>
                </div>

                {/* 5. Preview Footer */}
                <div className="p-3 border-t border-zinc-200 bg-white text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                  <span>© {storeName || "Your Store"}</span>
                  <span>WhatsApp Ordering Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* SUCCESS SCREEN MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 text-center relative font-body animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-950 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-300 shadow-glow">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                Setup Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Congratulations! Your store is live.
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Your storefront has been successfully generated and published to the global network.
              </p>
            </div>

            {/* Store URL Highlight Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                Your Storefront Public Link
              </span>
              <div className="flex items-center justify-between gap-2 bg-black/60 p-2.5 rounded-xl border border-white/10">
                <span className="text-xs font-mono text-amber-400 truncate">
                  {generatedStoreUrl}
                </span>
                <button
                  onClick={copyStoreUrl}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={copyStoreUrl}
                  leftIcon={<Copy className="w-4 h-4" />}
                  className="border-white/10 text-xs"
                >
                  Copy Link
                </Button>
                <a href={generatedStoreUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="secondary"
                    className="w-full text-xs font-bold border-white/20"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Visit Store
                  </Button>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-11 text-xs uppercase tracking-wider font-bold border-white/10"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Go To Dashboard
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push("/dashboard/products/new")}
                  className="w-full h-11 text-xs uppercase tracking-wider font-bold shadow-glow"
                  rightIcon={<Plus className="w-4 h-4" />}
                >
                  Add Your First Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
