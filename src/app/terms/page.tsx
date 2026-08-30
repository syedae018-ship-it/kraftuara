import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Sparkles,
  ShieldCheck,
  FileText,
  Clock,
  ArrowLeft,
  Mail,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  CURRENT_TERMS_VERSION,
  TERMS_EFFECTIVE_DATE,
  TERMS_LAST_UPDATED,
  TERMS_CANONICAL_URL,
  LEGAL_CONTACT_EMAIL,
  SUPPORT_CONTACT_EMAIL,
} from "@/lib/constants/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions | Kraftaura – Merchant Service Agreement",
  description:
    "Review the terms, conditions, merchant responsibilities, payment processing terms, and acceptable use policies for Kraftaura storefront and catalog SaaS platform.",
  alternates: {
    canonical: TERMS_CANONICAL_URL,
  },
  openGraph: {
    title: "Terms & Conditions | Kraftaura",
    description:
      "Review the Terms of Service and Merchant Agreement for using the Kraftaura online store and catalog platform.",
    url: TERMS_CANONICAL_URL,
    siteName: "Kraftaura",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms & Eligibility" },
  { id: "account", title: "2. Account Registration & Security" },
  { id: "merchant-responsibilities", title: "3. Merchant Roles & Store Operations" },
  { id: "catalog-pricing", title: "4. Product Catalog, Inventory & Pricing" },
  { id: "orders-fulfillment", title: "5. Customer Orders & WhatsApp Invoicing" },
  { id: "payments-razorpay", title: "6. Payment Processing & Razorpay Gateway" },
  { id: "subscriptions-billing", title: "7. Platform Subscriptions & Plan Limits" },
  { id: "trials-recurring", title: "8. Free Trials & Auto-Renewing Billing" },
  { id: "cancellations-refunds", title: "9. Cancellations, Downgrades & Refund Policy" },
  { id: "promotions-coupons", title: "10. Coupons & Merchant Promotional Codes" },
  { id: "custom-domains", title: "11. Custom Domains & DNS Routing" },
  { id: "platform-availability", title: "12. Platform Availability & Maintenance" },
  { id: "acceptable-use", title: "13. Acceptable Use & Prohibited Products" },
  { id: "intellectual-property", title: "14. Intellectual Property Rights" },
  { id: "user-content", title: "15. User-Generated Content & License Grant" },
  { id: "third-party-services", title: "16. Third-Party Integrations & WhatsApp" },
  { id: "suspension-termination", title: "17. Suspension & Account Termination" },
  { id: "privacy-data", title: "18. Data Privacy & Customer Information" },
  { id: "disclaimer", title: "19. Disclaimer of Warranties" },
  { id: "liability-limitation", title: "20. Limitation of Liability & Indemnity" },
  { id: "modifications", title: "21. Modifications to Terms & Versioning" },
  { id: "governing-law", title: "22. Governing Law & Dispute Resolution" },
  { id: "contact-information", title: "23. Legal Contact Information" },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-maroon-800/80 font-body">
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-maroon-900/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="Return to Kraftaura Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white font-brand font-bold text-xs uppercase tracking-wider shadow-glow group-hover:border-maroon-500 transition-colors">
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

      {/* Page Header */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-[#111111]/80 to-[#080808]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-maroon-950/80 border border-maroon-700/50 text-maroon-300">
              <ShieldCheck className="w-3.5 h-3.5 text-maroon-400" />
              Legal Agreement
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Version: {CURRENT_TERMS_VERSION}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            Terms & Conditions
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            These Terms of Service govern your access to and use of Kraftaura’s digital catalog,
            storefront creation software, subscription services, and merchant tools. Please read
            these terms carefully before creating an account or operating a storefront.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-500 font-mono">
            <div>
              <span className="text-zinc-400 font-semibold">Effective Date:</span> {TERMS_EFFECTIVE_DATE}
            </div>
            <div>
              <span className="text-zinc-400 font-semibold">Last Updated:</span> {TERMS_LAST_UPDATED}
            </div>
            <div>
              <span className="text-zinc-400 font-semibold">Status:</span>{" "}
              <span className="text-emerald-400 font-medium">Active & Legally Binding</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Quick Table of Contents Sidebar (Desktop / Tablet) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-maroon-300">
                <FileText className="w-4 h-4 text-maroon-400" />
                <span>Table of Contents</span>
              </div>
              <nav className="space-y-1 text-xs text-zinc-400 font-body max-h-[70vh] overflow-y-auto pr-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block py-1.5 px-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors leading-snug"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
              <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-500">
                Need privacy details? Visit our{" "}
                <Link href="/privacy" className="text-maroon-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </div>
            </div>
          </aside>

          {/* Legal Document Clauses */}
          <article className="lg:col-span-8 space-y-12 text-zinc-300 font-body text-sm leading-relaxed">
            {/* Section 1 */}
            <section id="acceptance" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">01.</span> Acceptance of Terms & Eligibility
              </h2>
              <p>
                By registering an account, clicking &ldquo;Create Account&rdquo;, accessing our website,
                or using any services provided by <strong>Kraftaura</strong> (&ldquo;Kraftaura&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you (&ldquo;Merchant&rdquo;,
                &ldquo;User&rdquo;, or &ldquo;you&rdquo;) enter into a legally binding agreement governed
                by these Terms and Conditions (&ldquo;Terms&rdquo;).
              </p>
              <p>
                To create a merchant account or utilize the Kraftaura platform, you represent and warrant
                that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>You are at least 18 years of age or the age of legal majority in your jurisdiction.</li>
                <li>You possess the legal capacity and authority to enter into these binding terms.</li>
                <li>If registering on behalf of a business entity, company, or proprietorship, you have full authority to bind that entity to these Terms.</li>
                <li>All registration information provided is accurate, current, and complete.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="account" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">02.</span> Account Registration & Security
              </h2>
              <p>
                When creating your Kraftaura merchant account, you must provide a valid business name,
                administrator email address, and a secure password. You are solely responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Maintaining the strict confidentiality of your account login credentials.</li>
                <li>All activities, modifications, and orders generated through your account.</li>
                <li>Promptly notifying Kraftaura support at <a href={`mailto:${SUPPORT_CONTACT_EMAIL}`} className="text-maroon-400 hover:underline">{SUPPORT_CONTACT_EMAIL}</a> if you detect or suspect any unauthorized access or security breach.</li>
              </ul>
              <p>
                Kraftaura reserves the right to suspend or terminate accounts with inaccurate, fictitious,
                or fraudulent registration details.
              </p>
            </section>

            {/* Section 3 */}
            <section id="merchant-responsibilities" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">03.</span> Merchant Roles & Store Operations
              </h2>
              <p>
                Kraftaura provides merchants with a software-as-a-service (SaaS) platform to build,
                host, customize, and manage online product catalogs and digital storefronts. As a merchant:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>You are the sole merchant of record for transactions conducted through your storefront.</li>
                <li>You are entirely responsible for your storefront&apos;s commercial policies, including shipping timelines, delivery logistics, returns, exchanges, and customer support.</li>
                <li>You must comply with all applicable local, state, national, and international laws, including consumer protection regulations, e-commerce disclosure mandates, and tax obligations (including GST/VAT where applicable).</li>
                <li>You must accurately present your business contact details, legal entity name, and operational policies to your end-customers.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="catalog-pricing" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">04.</span> Product Catalog, Inventory & Pricing
              </h2>
              <p>
                Merchants retain full discretion over their product listings, item descriptions,
                photography, inventory quantities, and pricing. You agree and guarantee that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>All product prices displayed on your storefront are accurate and include applicable taxes or fees as mandated by law.</li>
                <li>Product descriptions, dimensions, ingredients, and specifications are truthful and not misleading.</li>
                <li>You hold legitimate title, licenses, or authorization to sell every item listed in your catalog.</li>
                <li>Kraftaura does not manufacture, inspect, store, or physically handle any merchant inventory.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="orders-fulfillment" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">05.</span> Customer Orders & WhatsApp Invoicing
              </h2>
              <p>
                Kraftaura enables direct ordering workflows, including WhatsApp-assisted checkouts and
                digital invoices. When an end-customer places an order through your storefront:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>The contractual relationship for the sale exists exclusively between you and your customer.</li>
                <li>Kraftaura is not a party to individual purchase contracts, delivery commitments, or fulfillment disputes.</li>
                <li>You must maintain reasonable communication channels to service customer order inquiries and handle order cancellations or modifications.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="payments-razorpay" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">06.</span> Payment Processing & Razorpay Gateway
              </h2>
              <p>
                Platform subscriptions, setup charges, and integrated online customer payments may be
                facilitated through authorized third-party payment gateways, including Razorpay
                Software Private Limited (&ldquo;Razorpay&rdquo;).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Payment processing services are subject to Razorpay&apos;s Terms of Service and Privacy Guidelines.</li>
                <li>Kraftaura does not store full credit card numbers, CVV codes, or net banking passwords on its servers.</li>
                <li>Merchants are responsible for merchant discount rates (MDR), gateway fees, and any bank settlement chargebacks associated with their payment accounts.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="subscriptions-billing" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">07.</span> Platform Subscriptions & Plan Limits
              </h2>
              <p>
                Access to advanced features, theme customizations, product capacity tiers, and custom
                domains is provided under subscription plans (e.g., Startup, Growth, Enterprise).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Subscription fees are billed in advance on a recurring monthly or annual basis as designated upon plan selection.</li>
                <li>Each plan includes specific resource allowances (e.g., maximum active products, bandwidth allocations, staff seats). Exceeding these allowances may require upgrading to a higher plan tier.</li>
                <li>Kraftaura reserves the right to modify subscription pricing with at least thirty (30) days prior electronic notice.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="trials-recurring" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">08.</span> Free Trials & Auto-Renewing Billing
              </h2>
              <p>
                Where applicable, Kraftaura offers introductory free trials (e.g., 3-day trial) for
                eligible merchants.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Activation of a free trial may require providing valid billing details and authorizing recurring auto-debit via our payment processor.</li>
                <li>Unless you cancel prior to the conclusion of the trial period, your selected plan will automatically convert into a paid recurring subscription.</li>
                <li>You authorize Kraftaura to charge your saved payment method for the applicable renewal cycle until cancelled.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="cancellations-refunds" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">09.</span> Cancellations, Downgrades & Refund Policy
              </h2>
              <p>
                Merchants may manage or cancel their platform subscription at any time via the
                Kraftaura billing dashboard.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li><strong>Cancellation Timing:</strong> Cancellation becomes effective at the conclusion of your current paid billing period. You retain platform access until that date.</li>
                <li><strong>Refunds:</strong> Subscription fees, one-time onboarding charges, and domain registration expenses are non-refundable except where required by applicable consumer protection laws or explicitly agreed upon in writing by Kraftaura management.</li>
                <li><strong>Data Retention on Downgrade:</strong> Downgrading to a lower plan tier may restrict access to features or require reducing catalog product counts to match the lower plan ceiling.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="promotions-coupons" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">10.</span> Coupons & Merchant Promotional Codes
              </h2>
              <p>
                Kraftaura allows merchants to create discount codes, percentage vouchers, and cart
                promotions for their storefront customers.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Merchants are solely liable for the terms, expiration, and financial impact of promotional codes created on their stores.</li>
                <li>Kraftaura promotional codes applied to platform subscription billing are subject to individual promotional rules and cannot be combined or transferred unless specified.</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section id="custom-domains" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">11.</span> Custom Domains & DNS Routing
              </h2>
              <p>
                Merchants on supported subscription plans may link custom top-level domain names to
                their Kraftaura storefront.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Merchants are responsible for maintaining domain registration and correct DNS record configurations with their third-party domain registrars.</li>
                <li>Kraftaura is not liable for storefront downtime resulting from expired domain registrations or misconfigured DNS records.</li>
                <li>Kraftaura automatically provisions standard SSL certificates for linked storefront domains.</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section id="platform-availability" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">12.</span> Platform Availability & Maintenance
              </h2>
              <p>
                Kraftaura employs modern cloud infrastructure and edge delivery networks to maximize
                platform uptime. However:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>We do not warrant that platform operations will be uninterrupted, error-free, or entirely free of temporary latency.</li>
                <li>Scheduled maintenance, security patches, and server upgrades will be performed periodically, with reasonable advance notice where feasible.</li>
                <li>Emergency maintenance may be executed without notice to safeguard data integrity or platform security.</li>
              </ul>
            </section>

            {/* Section 13 */}
            <section id="acceptable-use" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">13.</span> Acceptable Use & Prohibited Products
              </h2>
              <p>
                You agree to use Kraftaura strictly for lawful commercial activities. You shall NOT list,
                advertise, sell, or facilitate orders for:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Illegal, counterfeit, or stolen merchandise",
                  "Firearms, ammunition, or regulated weapons",
                  "Narcotics, prescription drugs, or illicit substances",
                  "Pornographic, explicit, or sexually suggestive media",
                  "Hate speech, harassment, or defamatory content",
                  "Malware, phishing scripts, or malicious software",
                  "Financial pyramid schemes or deceptive MLM offers",
                  "Items infringing third-party trademarks or copyrights",
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-300"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="pt-2 text-xs text-zinc-400">
                Any violation of acceptable use policies constitutes grounds for immediate account
                termination without refund.
              </p>
            </section>

            {/* Section 14 */}
            <section id="intellectual-property" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">14.</span> Intellectual Property Rights
              </h2>
              <p>
                Kraftaura retains all right, title, and interest in and to the platform, including its
                software code, visual themes, user interfaces, documentation, logos, and trademarks.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>You are granted a limited, revocable, non-exclusive, non-transferable license to access and use the platform in accordance with your active subscription.</li>
                <li>You may not decompile, reverse engineer, copy, distribute, or create derivative works based on Kraftaura platform code or theme templates without express written authorization.</li>
              </ul>
            </section>

            {/* Section 15 */}
            <section id="user-content" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">15.</span> User-Generated Content & License Grant
              </h2>
              <p>
                Merchants retain full ownership of all logos, brand names, product photographs,
                marketing descriptions, and catalog content uploaded to the platform (&ldquo;Merchant Content&rdquo;).
              </p>
              <p>
                You grant Kraftaura a worldwide, royalty-free, non-exclusive license to host, display,
                format, and transmit your Merchant Content solely for the purpose of operating your
                storefront, generating catalog previews, and fulfilling platform services.
              </p>
            </section>

            {/* Section 16 */}
            <section id="third-party-services" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">16.</span> Third-Party Integrations & WhatsApp
              </h2>
              <p>
                Kraftaura integrates with third-party tools such as WhatsApp, Razorpay, and storage
                providers. Your use of these services is governed by their respective terms of service.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Kraftaura is not affiliated with, endorsed by, or sponsored by WhatsApp Inc. or Meta Platforms, Inc.</li>
                <li>We do not control and are not liable for third-party service interruptions, API deprecations, or policy changes enacted by external providers.</li>
              </ul>
            </section>

            {/* Section 17 */}
            <section id="suspension-termination" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">17.</span> Suspension & Account Termination
              </h2>
              <p>
                Kraftaura reserves the right to suspend, restrict, or terminate any merchant account or
                storefront immediately if:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>You breach any provision of these Terms or the Acceptable Use Policy.</li>
                <li>Required subscription payments fail or are charged back.</li>
                <li>Your storefront engages in deceptive, illegal, or abusive conduct toward consumers.</li>
                <li>Required by law enforcement or regulatory order.</li>
              </ul>
            </section>

            {/* Section 18 */}
            <section id="privacy-data" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">18.</span> Data Privacy & Customer Information
              </h2>
              <p>
                Our collection, storage, and processing of personal and business information are
                governed by the{" "}
                <Link href="/privacy" className="text-maroon-400 hover:underline font-semibold">
                  Kraftaura Privacy Policy
                </Link>
                .
              </p>
              <p>
                Merchants acting as data controllers for their customer information agree to handle all
                customer personal data with industry-standard care, confidentiality, and in compliance
                with applicable privacy laws.
              </p>
            </section>

            {/* Section 19 */}
            <section id="disclaimer" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">19.</span> Disclaimer of Warranties
              </h2>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                THE KRAFTAURA PLATFORM, SERVICES, TEMPLATES, AND TOOLS ARE PROVIDED ON AN &ldquo;AS IS&rdquo;
                AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
                A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. KRAFTAURA DOES NOT GUARANTEE SPECIFIC
                SALES REVENUE, CONVERSION RATES, OR COMMERCIAL SUCCESS FOR ANY MERCHANT STOREFRONT.
              </div>
            </section>

            {/* Section 20 */}
            <section id="liability-limitation" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">20.</span> Limitation of Liability & Indemnity
              </h2>
              <p>
                To the maximum extent permitted by applicable law, in no event shall Kraftaura, its
                officers, employees, agents, or licensors be liable for any indirect, incidental,
                special, punitive, or consequential damages (including loss of profits, data, revenue,
                or goodwill) arising out of or related to your use of or inability to use the platform.
              </p>
              <p>
                Our aggregate liability for all claims relating to the platform shall not exceed the total
                amount of subscription fees actually paid by you to Kraftaura in the three (3) months
                preceding the event giving rise to liability.
              </p>
              <p>
                You agree to indemnify and hold harmless Kraftaura against any third-party claims,
                liabilities, damages, and legal costs arising from your storefront content, product
                sales, customer disputes, or violation of these Terms.
              </p>
            </section>

            {/* Section 21 */}
            <section id="modifications" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">21.</span> Modifications to Terms & Versioning
              </h2>
              <p>
                We reserve the right to revise or update these Terms to reflect changes in our service
                architecture, legal mandates, or business operations.
              </p>
              <p>
                Each iteration is identified by a version index (current:{" "}
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-maroon-300 font-mono text-xs">
                  {CURRENT_TERMS_VERSION}
                </code>
                ). Material changes will be communicated via your account notification center or
                registered email at least 15 days before taking effect. Continued use of Kraftaura after
                the effective date of revisions constitutes acceptance of the updated terms.
              </p>
            </section>

            {/* Section 22 */}
            <section id="governing-law" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">22.</span> Governing Law & Dispute Resolution
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India,
                without regard to its conflict of law principles.
              </p>
              <p>
                Any dispute, controversy, or claim arising out of or relating to these Terms or platform
                usage shall be submitted to the exclusive jurisdiction of the competent courts situated
                in Bengaluru, Karnataka, India.
              </p>
            </section>

            {/* Section 23 */}
            <section id="contact-information" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white border-b border-white/10 pb-3 flex items-center gap-2.5">
                <span className="text-maroon-400 font-mono text-lg">23.</span> Legal Contact Information
              </h2>
              <p>
                If you have questions, inquiries, or notices regarding these Terms & Conditions or our
                merchant agreements, please contact our legal and support team:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-maroon-400">
                    <Mail className="w-4 h-4" /> Legal Department
                  </div>
                  <p className="text-xs text-zinc-400">Formal legal correspondence & notices:</p>
                  <a
                    href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                    className="inline-block text-sm font-semibold text-white hover:text-maroon-300 transition-colors"
                  >
                    {LEGAL_CONTACT_EMAIL}
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    <HelpCircle className="w-4 h-4" /> Merchant Support
                  </div>
                  <p className="text-xs text-zinc-400">Account, billing & operational inquiries:</p>
                  <a
                    href={`mailto:${SUPPORT_CONTACT_EMAIL}`}
                    className="inline-block text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
                  >
                    {SUPPORT_CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </section>

            {/* Bottom Actions Card */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-500">
                Kraftaura Storefront & Catalog Platform &bull; {CURRENT_TERMS_VERSION}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/privacy"
                  className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-zinc-700">&bull;</span>
                <Link
                  href="/signup"
                  className="text-xs font-semibold text-maroon-400 hover:text-maroon-300 transition-colors"
                >
                  Create Merchant Account &rarr;
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
