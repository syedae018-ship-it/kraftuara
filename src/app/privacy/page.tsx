import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Store, ShieldCheck, Clock, ArrowLeft, Mail, Lock } from "lucide-react";
import {
  CURRENT_PRIVACY_VERSION,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_LAST_UPDATED,
  PRIVACY_CANONICAL_URL,
  LEGAL_CONTACT_EMAIL,
  SUPPORT_CONTACT_EMAIL,
} from "@/lib/constants/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Kraftaura – Merchant Data & Security Guidelines",
  description:
    "Learn how Kraftaura collects, protects, and handles merchant data, store information, and customer privacy on our catalog platform.",
  alternates: {
    canonical: PRIVACY_CANONICAL_URL,
  },
  openGraph: {
    title: "Privacy Policy | Kraftaura",
    description:
      "Privacy policy and data protection practices for Kraftaura merchant storefront platform.",
    url: PRIVACY_CANONICAL_URL,
    siteName: "Kraftaura",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-maroon-800/80 font-body">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-maroon-900/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Kraftaura Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white font-brand font-bold text-xs uppercase tracking-wider shadow-glow">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline font-heading">
              <span className="font-extrabold text-white text-base tracking-tight">Kraft</span>
              <span className="font-normal text-zinc-300 text-base tracking-tight">aura</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Registration</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-zinc-300 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-[#111111]/80 to-[#080808]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-maroon-950/80 border border-maroon-700/50 text-maroon-300">
              <Lock className="w-3.5 h-3.5 text-maroon-400" />
              Privacy & Security
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Version: {CURRENT_PRIVACY_VERSION}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            Kraftaura is committed to safeguarding the privacy and security of merchants and their
            customers. This policy details our data collection, handling, and security practices.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-500 font-mono">
            <div>
              <span className="text-zinc-400 font-semibold">Effective Date:</span> {PRIVACY_EFFECTIVE_DATE}
            </div>
            <div>
              <span className="text-zinc-400 font-semibold">Last Updated:</span> {PRIVACY_LAST_UPDATED}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 text-zinc-300 text-sm leading-relaxed font-body">
        <section className="space-y-3">
          <h2 className="text-xl font-bold font-heading text-white">1. Information We Collect</h2>
          <p>
            When you register for Kraftaura or manage your store, we collect information necessary to
            provide and secure our platform services:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li><strong>Account Information:</strong> Name, business name, email address, password hash, and terms acceptance timestamp.</li>
            <li><strong>Storefront Data:</strong> Product catalog items, pricing, images, logos, theme preferences, and business contact information (WhatsApp number, Instagram handle, address).</li>
            <li><strong>Transactional & Order Metadata:</strong> Store order records, customer checkout selections, and invoice summaries generated through your store.</li>
            <li><strong>Technical Diagnostics:</strong> IP address, device type, browser headers, and platform interaction logs used for security monitoring.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold font-heading text-white">2. How We Use Your Data</h2>
          <p>We process merchant information strictly to:</p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>Operate, maintain, and deliver your digital storefront and catalog system.</li>
            <li>Facilitate customer WhatsApp order generation and payment settlements.</li>
            <li>Authenticate user access and enforce Row-Level Security across tenant databases.</li>
            <li>Send administrative service notifications, security alerts, and subscription updates.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold font-heading text-white">3. Multi-Tenant Data Isolation & Security</h2>
          <p>
            Kraftaura employs PostgreSQL Row-Level Security (RLS) and cryptographic session handling
            through Supabase Auth. Each merchant&apos;s product catalogs, analytics, customer orders, and
            settings are strictly isolated and protected from unauthorized cross-tenant access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold font-heading text-white">4. Payment Information Security</h2>
          <p>
            Payment transactions for platform subscriptions and customer checkouts are processed via
            certified payment partners, including Razorpay. We do not store sensitive cardholder data
            (such as full card numbers or security codes) on our application servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold font-heading text-white">5. Third-Party Service Providers</h2>
          <p>
            We may engage trusted third-party providers (such as cloud hosting, image delivery CDNs,
            and transactional email infrastructure) solely to support platform functionality under strict
            confidentiality and security standards. We do not sell merchant or customer data to third-party
            advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold font-heading text-white">6. Your Rights & Contact</h2>
          <p>
            Merchants may access, update, or export their catalog data at any time via the Kraftaura
            dashboard. For data privacy inquiries or account data deletion requests, contact us at:
          </p>
          <div className="p-4 rounded-xl bg-[#111111] border border-white/10 flex items-center gap-3">
            <Mail className="w-5 h-5 text-maroon-400 shrink-0" />
            <div>
              <p className="text-xs text-zinc-400">Privacy & Data Protection Contact:</p>
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-sm font-semibold text-white hover:text-maroon-300">
                {LEGAL_CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500">
            Kraftaura Platform &bull; {CURRENT_PRIVACY_VERSION}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/terms" className="text-xs font-medium text-maroon-400 hover:underline">
              Terms & Conditions
            </Link>
            <span className="text-zinc-700">&bull;</span>
            <Link href="/signup" className="text-xs font-semibold text-white hover:text-zinc-300">
              Create Account &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
