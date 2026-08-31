import React from "react";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import BloomContactPage from "@/components/storefront/templates/bloom/contact/BloomContactPage";
import { Metadata } from "next";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStoreUrl } from "@/lib/urls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(slug, supabase);
  if (!store) return {};

  const canonicalUrl = `${getStoreUrl(slug)}/contact`;

  return {
    title: `Contact Us | ${store.name}`,
    description: `Get in touch with ${store.name}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Contact Us | ${store.name}`,
      description: `Get in touch with ${store.name}`,
      url: canonicalUrl,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const requestHeaders = await headers();
  const isSubdomain = requestHeaders.get("x-is-subdomain") === "true";

  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(slug, supabase);
  if (!store) return notFound();

  return (
    <BloomContactPage
      store={store}
      isSubdomain={isSubdomain}
    />
  );
}
