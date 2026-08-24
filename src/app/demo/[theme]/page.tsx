import React from "react";
import BloomStorefront from "@/components/storefront/templates/bloom/home/BloomStorefront";
import { DEMO_STORE_DATA } from "@/lib/demo-data";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Craft Store Classic — Live Demo Storefront",
    description: "Interactive live demo of the Craft Store Classic storefront with WhatsApp ordering.",
  };
}

export default async function DemoThemePage({
  searchParams,
}: {
  params: Promise<{ theme: string }>;
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
