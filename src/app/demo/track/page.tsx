import React from "react";
import BloomTrackOrderPage from "@/components/storefront/templates/bloom/track/BloomTrackOrderPage";
import { DEMO_STORE_DATA } from "@/lib/demo-data";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Order | Kraftaura Classic Demo",
  description:
    "Experience Kraftaura's live order tracking. Track real-time order status, fulfillment timeline, and delivery updates.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DemoTrackPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <BloomTrackOrderPage
      store={DEMO_STORE_DATA}
      isSubdomain={false}
      initialOrderId={orderId || "KRA-DEMO-1001"}
    />
  );
}
