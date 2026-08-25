import React from "react";
import BloomStorefront from "@/components/storefront/templates/bloom/home/BloomStorefront";
import { DEMO_STORE_DATA } from "@/lib/demo-data";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kraftaura Classic — Live Demo Storefront",
  description: "Interactive live demo of the Kraftaura Classic storefront with WhatsApp ordering and 6 curated artisan products.",
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
