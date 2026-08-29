import React from "react";
import BloomStorefront from "@/components/storefront/templates/bloom/home/BloomStorefront";
import { DEMO_STORE_DATA } from "@/lib/demo-data";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Store Demo – Kraftaura Online Store Builder",
  description:
    "Experience Kraftaura's live demo store. See how your products look with WhatsApp ordering, responsive design, and smooth navigation.",
  alternates: {
    canonical: "https://www.kraftaura.in/demo",
  },
  openGraph: {
    title: "Live Store Demo – Kraftaura Online Store Builder",
    description:
      "Experience Kraftaura's live demo store. See how your products look with WhatsApp ordering, responsive design, and smooth navigation.",
    url: "https://www.kraftaura.in/demo",
    siteName: "Kraftaura",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Store Demo – Kraftaura Online Store Builder",
    description:
      "Experience Kraftaura's live demo store. See how your products look with WhatsApp ordering, responsive design, and smooth navigation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; collection?: string }>;
}) {
  const { category, collection } = await searchParams;

  return (
    <BloomStorefront
      store={DEMO_STORE_DATA}
      isSubdomain={false}
      initialCategory={category}
      initialCollection={collection}
    />
  );
}
