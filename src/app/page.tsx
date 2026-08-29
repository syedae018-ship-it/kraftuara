import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Kraftaura – Online Store Builder for Small Businesses in India",
  description:
    "Create your online store in minutes with Kraftaura. Sell through WhatsApp, accept online payments, manage products and grow your small business in India.",
  alternates: {
    canonical: "https://www.kraftaura.in/",
  },
  openGraph: {
    title: "Kraftaura – Online Store Builder for Small Businesses in India",
    description:
      "Create your online store in minutes with Kraftaura. Sell through WhatsApp, accept online payments, manage products and grow your small business in India.",
    url: "https://www.kraftaura.in/",
    siteName: "Kraftaura",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kraftaura – Online Store Builder for Small Businesses in India",
    description:
      "Create your online store in minutes with Kraftaura. Sell through WhatsApp, accept online payments, manage products and grow your small business in India.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.kraftaura.in/#organization",
      name: "Kraftaura",
      url: "https://www.kraftaura.in/",
      description:
        "Kraftaura is an India-focused online store and catalog platform that helps small and local businesses create a branded online store, showcase products, sell through WhatsApp, accept online payments, and manage their business online.",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.kraftaura.in/#website",
      url: "https://www.kraftaura.in/",
      name: "Kraftaura",
      publisher: {
        "@id": "https://www.kraftaura.in/#organization",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.kraftaura.in/#software",
      name: "Kraftaura",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.kraftaura.in/",
      description:
        "India-focused online store and catalog builder that helps small businesses create a branded online store, sell through WhatsApp, accept online payments, and manage orders.",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: "99",
        highPrice: "999",
        offerCount: "3",
      },
    },
  ],
};

export default function RootPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
