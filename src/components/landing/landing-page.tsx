"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Monitor,
  ShoppingBag,
  MessageSquare,
  BarChart3,
  Paintbrush,
  Zap,
  Globe,
  HelpCircle,
  Star,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Layers,
  Store,
  Eye,
} from "lucide-react";
import { PLANS } from "@/lib/feature-gating";
import { LandingNavbar } from "./landing-navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Kraftaura Classic Template for Landing Showcase
const craftStoreClassicTemplate = {
  id: "bloom",
  name: "Kraftaura Classic",
  tag: "Artisan, Homeware, Boutique & Modern Catalog",
  desc: "Clean, high-converting light aesthetic tailored for boutique storefronts, handcrafted artisan goods, and modern brands with instant WhatsApp buy.",
  desktopImg: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=1400",
  mobileImg: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600",
  accent: "from-amber-500/20 to-maroon-900/30",
};

const featuresList = [
  {
    title: "Store Builder",
    desc: "Drag and drop sections with instant live preview. Set up in under 2 minutes without coding.",
    icon: Layers,
  },
  {
    title: "WhatsApp Store",
    desc: "Instant direct-to-WhatsApp order routing with pre-filled cart summaries & buyer address.",
    icon: MessageSquare,
  },
  {
    title: "E-commerce Engine",
    desc: "Full checkout support with Razorpay integration, online payments, shipping, and automated receipts.",
    icon: ShoppingBag,
  },
  {
    title: "Real-time Analytics",
    desc: "Track visitors, link clicks, category conversions, and store revenue in a sleek dashboard.",
    icon: BarChart3,
  },
  {
    title: "Creative Services",
    desc: "Order custom banner graphics and promotional assets directly within your store admin panel.",
    icon: Paintbrush,
  },
  {
    title: "Storefront Design",
    desc: "Kraftaura Classic layout with complete typography, palette customizer, and instant responsive layouts.",
    icon: Sparkles,
  },
  {
    title: "Fast Setup",
    desc: "Optimized performance, mobile responsiveness, and automatic domain management.",
    icon: Zap,
  },
];

const pricingPlans = [
  {
    name: "Startup Pack",
    price: `₹${PLANS.startup.priceMonthly}`,
    period: "month",
    description: PLANS.startup.description,
    features: [
      "WhatsApp Catalog Order Buttons",
      "Basic Dashboard Overview",
      "Product Management (up to 12 products)",
      "Dedicated Storefront URL Link",
      "Kraftaura Classic template access",
      "Custom Logo Upload",
    ],
    cta: "Choose Startup Pack",
    href: "/signup?plan=startup",
    popular: false,
  },
  {
    name: "Growth Pack",
    price: `₹${PLANS.growth.priceMonthly}`,
    period: "month",
    description: PLANS.growth.description,
    features: [
      "Everything in Startup Pack",
      "Product Management (up to 24 products)",
      "Store Analytics & Traffic Insights (Store Views)",
      "Curated Collections & Taxonomies",
      "Advanced Customization & Branding",
      "Creative discounts & promo codes",
    ],
    cta: "Choose Growth Pack",
    href: "/signup?plan=growth",
    popular: true,
  },
  {
    name: "Pro Plan",
    price: `₹${PLANS.pro.priceMonthly}`,
    period: "month",
    description: PLANS.pro.description,
    features: [
      "Everything in Growth Pack",
      "Product Management (up to 100 products)",
      "Direct Razorpay Payment Gateway & Checkout",
      "Order Management & Customer Invoicing",
      "Shipping Integration & Tracking Labels",
      "Revenue Analytics & Sales Graphs",
      "Discount Coupons & Promotional Banners",
      "Real-time Inventory & Stock Alerts",
      "Custom Domain Mapping",
    ],
    cta: "Choose Pro Plan",
    href: "/signup?plan=pro",
    popular: false,
  },
];

const faqs = [
  {
    q: "How does the WhatsApp Ordering system work?",
    a: "When customers click 'Buy on WhatsApp' or check out on your store, their cart is converted into a pre-formatted WhatsApp message and sent directly to your business phone number.",
  },
  {
    q: "Can I use my own custom domain?",
    a: "Yes! While every store comes with a free brand.platform.com subdomain, Pro Plan allows you to connect your custom domain (e.g. store.com).",
  },
  {
    q: "Do I need coding skills to customize my store?",
    a: "Not at all. Our visual store editor lets you customize colors, logos, fonts, buttons, and layout order in real time with instant live previews.",
  },
  {
    q: "What payment gateways are supported?",
    a: "Business plan stores support Razorpay for direct UPI, Credit/Debit cards, and net banking payments alongside WhatsApp manual payment confirmation.",
  },
];

export function LandingPage() {
  const [activeDevice, setActiveDevice] = useState<"desktop" | "mobile">("desktop");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const currentTemplateObj = craftStoreClassicTemplate;

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-maroon-800 selection:text-white font-body relative overflow-hidden">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-maroon-900/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-[1200px] right-0 w-[600px] h-[600px] bg-maroon-950/20 blur-[180px] pointer-events-none rounded-full" />

      {/* Navbar */}
      <LandingNavbar />

      {/* 1. HERO SECTION */}
      <section className="pt-28 sm:pt-36 pb-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto text-center space-y-10 relative z-10 flex flex-col items-center">
        {/* Animated Gradient Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-gradient-to-r from-maroon-800/40 via-purple-900/40 to-maroon-800/40 blur-[120px] pointer-events-none rounded-full animate-pulse-glow" />

        <div className="space-y-5 max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-maroon-950/80 border border-maroon-700/50 text-maroon-300 text-xs font-semibold font-heading shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-maroon-400" />
            <span>Next-Gen WhatsApp Commerce & Storefront Platform</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight text-white leading-[1.1]">
            Build Your Online Store <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-maroon-400">
              in Minutes
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-body leading-relaxed">
            Create a branded online store for your business, sell through WhatsApp, accept online payments, and manage everything in one place.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
          <Link href="/signup">
            <Button
              variant="primary"
              size="lg"
              className="h-12 px-8 text-sm font-semibold shadow-glow-lg w-full sm:w-auto"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Free
            </Button>
          </Link>
          <Link href="/demo" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="h-12 px-7 text-sm font-semibold border-white/10 hover:border-white/20 w-full sm:w-auto"
              leftIcon={<ExternalLink className="w-4 h-4 text-maroon-400" />}
            >
              View Live Demo
            </Button>
          </Link>
        </div>

        {/* Trust Badges & Statistics */}
        <div className="pt-6 pb-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-body text-zinc-400 relative z-10">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Bank-Grade</span> Security
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">No Code</span> Required
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">99.9%</span> Uptime
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">100+</span> Active Stores
          </div>
        </div>

        {/* Hero Device Mockup Previews (Desktop & Mobile) */}
        <div className="pt-10 max-w-6xl mx-auto relative z-10 flex items-end justify-center">
          {/* Desktop Mockup */}
          <div className="relative rounded-2xl sm:rounded-3xl p-2 sm:p-4 bg-[#111111]/80 border border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden maroon-gradient-border z-10 hidden md:block md:w-[800px]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#080808]/60 rounded-xl mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="px-4 py-1 rounded-lg bg-[#151515] border border-white/10 text-[11px] font-mono text-zinc-400">
                craft-store.platform.com
              </div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Store
              </div>
            </div>

            <div className="relative aspect-[16/9] rounded-xl overflow-hidden group">
              <img
                src={craftStoreClassicTemplate.desktopImg}
                alt="Kraftaura Classic online store showcase on desktop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/30 flex items-end p-6 sm:p-10 text-left">
                <div className="space-y-2">
                  <Badge variant="maroon" className="text-xs uppercase tracking-widest font-heading">
                    Kraftaura Classic
                  </Badge>
                  <h3 className="text-xl sm:text-3xl font-bold font-heading text-white">
                    Artisan Living & Modern Essentials
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Mockup */}
          <div className="relative md:absolute md:-right-8 md:-bottom-8 z-20 w-[260px] sm:w-[300px] rounded-[36px] border-4 border-zinc-700 bg-black p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-700 rounded-b-3xl z-30"></div>
            <div className="relative w-full h-[450px] sm:h-[550px] rounded-[24px] overflow-hidden bg-[#111111]">
              <img
                src={craftStoreClassicTemplate.mobileImg}
                alt="Kraftaura Classic online store mobile view with WhatsApp buy button"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-0 w-full px-4">
                 <Link href="/demo">
                   <Button variant="primary" className="w-full text-[10px] h-10 shadow-glow" leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}>
                     Buy Now on WhatsApp
                   </Button>
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TEMPLATES SHOWCASE */}
      <section id="templates" className="pt-12 pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12 border-t border-white/10">
        <div className="text-center space-y-3">
          <Badge variant="maroon" className="text-xs uppercase tracking-wider">
            Signature Design System
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white tracking-tight">
            Kraftaura Classic
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl mx-auto font-body">
            Tailored storefront design optimized for artisan makers, boutique designers, and modern brands.
          </p>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-1 bg-[#151515] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveDevice("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-colors",
                activeDevice === "desktop" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setActiveDevice("mobile")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-colors",
                activeDevice === "mobile" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        </div>

        {/* Active Template Showcase Canvas */}
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-6 text-left">
              <div>
                <span className="text-xs text-maroon-400 font-mono font-semibold uppercase tracking-widest block mb-1">
                  {craftStoreClassicTemplate.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                  Kraftaura Classic Template
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-2 font-body">
                  {craftStoreClassicTemplate.desc}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-zinc-300 font-body">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Fully responsive, mobile-first layouts
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300 font-body">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Font & color customization presets
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300 font-body">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Instant checkout via WhatsApp
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Link href="/demo" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    className="px-6 text-xs uppercase tracking-wider font-heading font-bold shadow-glow"
                    leftIcon={<Eye className="w-4 h-4 text-white" />}
                  >
                    Preview Live Demo
                  </Button>
                </Link>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="md"
                    className="px-6 text-xs uppercase tracking-wider font-heading font-bold border-white/10"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Use Template
                  </Button>
                </Link>
              </div>
            </div>

            {/* Live Responsive Frame */}
            <div className="lg:col-span-7 flex justify-center items-center">
              <AnimatePresence mode="wait">
                {activeDevice === "desktop" ? (
                  <motion.div
                    key="desktop"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full rounded-2xl border border-white/10 bg-[#151515] p-2 shadow-2xl overflow-hidden"
                  >
                    <img
                      src={craftStoreClassicTemplate.desktopImg}
                      alt={`${craftStoreClassicTemplate.name} boutique storefront layout preview on desktop`}
                      className="w-full h-[320px] sm:h-[400px] object-cover rounded-xl"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mobile"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-[280px] sm:w-[320px] rounded-[36px] border-4 border-zinc-700 bg-black p-3 shadow-2xl overflow-hidden"
                  >
                    <img
                      src={craftStoreClassicTemplate.mobileImg}
                      alt={`${craftStoreClassicTemplate.name} mobile responsive storefront preview`}
                      className="w-full h-[450px] object-cover rounded-[24px]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12 border-t border-white/10">
        <div className="text-center space-y-3">
          <Badge variant="maroon" className="text-xs uppercase tracking-wider">
            All-in-One SaaS Toolkit
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white tracking-tight">
            Engineered for Modern SaaS Merchants
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Everything you need to showcase, market, and sell your products seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                key={i}
                className="bg-[#111111] border-white/10 hover:border-maroon-700/50 p-6 space-y-4 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-maroon-950/80 border border-maroon-700/40 flex items-center justify-center text-maroon-400 group-hover:bg-maroon-800 group-hover:text-white transition-colors shadow-glow">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-bold font-heading text-white">{f.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-body">{f.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12 border-t border-white/10">
        <div className="text-center space-y-3">
          <Badge variant="maroon" className="text-xs uppercase tracking-wider">
            Flexible Plans
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white tracking-tight">
            Transparent Pricing for Every Business Tier
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Get started with a 3-day free trial on any of our plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
          {pricingPlans.map((plan: any) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 border text-left",
                plan.popular
                  ? "bg-[#151515] border-maroon-600 shadow-glow-lg maroon-gradient-border scale-[1.02]"
                  : "bg-[#111111] border-white/10 hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-maroon-800 border border-maroon-500 text-[10px] uppercase font-mono font-bold tracking-widest text-white shadow-glow">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-maroon-400">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold font-heading text-white">{plan.price}</span>
                    <span className="text-xs text-zinc-500 font-body">/{plan.period}</span>
                  </div>
                  {plan.setupFee && (
                    <p className="text-[10px] text-amber-500 font-mono mt-1 font-semibold">
                      + {plan.setupFee}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 mt-2 font-body">{plan.description}</p>
                </div>

                <div className="space-y-2.5 border-t border-white/10 pt-4">
                  {plan.features.map((feat: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300 font-body">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-zinc-400 font-body text-center bg-white/5 p-2 rounded-xl border border-white/5 mt-2">
                  🎁 Includes a 3-Day Free Trial (requires automatic recurring authorization)
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <Link href={plan.href} className="w-full">
                  <Button
                    variant={plan.popular ? "primary" : "secondary"}
                    className="w-full justify-center h-11 text-xs font-semibold uppercase tracking-wider"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto space-y-12 border-t border-white/10">
        <div className="text-center space-y-3">
          <Badge variant="maroon" className="text-xs uppercase tracking-wider">
            Help Center
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left font-heading text-sm font-semibold text-white hover:text-maroon-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200", isOpen && "rotate-180")}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-zinc-400 font-body leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12 border-t border-white/10 text-center">
        <div className="space-y-3">
          <Badge variant="maroon" className="text-xs uppercase tracking-wider">
            Merchant Love
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white tracking-tight">
            Trusted by 100+ Catalog Merchants
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              quote: "Kraftaura transformed our luxury perfume business. Customers love the instant WhatsApp order link!",
              author: "Tariq Al-Mansoor",
              role: "Owner, Aroma Perfumes",
              img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            },
            {
              quote: "The visual appearance editor is super smooth. Setting up custom maroon colors took less than a minute.",
              author: "Ayesha Malik",
              role: "Founder, Royal Apparel",
              img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            },
            {
              quote: "Having Razorpay payments alongside direct WhatsApp ordering gives us the best of both worlds.",
              author: "Zaid Shaikh",
              role: "Director, Al Noor Tech",
              img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
            },
          ].map((t, i) => (
            <Card key={i} className="bg-[#111111] border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 italic font-body leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <img src={t.img} alt={t.author} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                <div>
                  <h4 className="text-xs font-bold font-heading text-white">{t.author}</h4>
                  <span className="text-[10px] text-zinc-500 font-body">{t.role}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-white/10 bg-[#060606] py-12 px-4 sm:px-6 lg:px-12 font-body text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white font-brand font-bold text-xs uppercase tracking-wider">
              KA
            </div>
            <div className="text-sm tracking-wide flex items-baseline font-heading">
              <span className="font-extrabold text-white">Kraft</span>
              <span className="font-normal text-zinc-300">aura</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 font-mono">SaaS Platform</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-white transition-colors">My Store Login</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Kraftaura Platform. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
