import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Providers from "./providers";

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kraftaura.in"),
  title: {
    default: "Kraftaura – Online Store Builder for Small Businesses in India",
    template: "%s | Kraftaura",
  },
  description:
    "Create your online store in minutes with Kraftaura. Sell through WhatsApp, accept online payments, manage products and grow your small business in India.",
  openGraph: {
    siteName: "Kraftaura",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-0Z2921645B";

  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body
        className={`${headingFont.variable} ${bodyFont.variable} [--font-brand:var(--font-heading)] bg-[#080808] text-white antialiased min-h-screen selection:bg-maroon-800/80 selection:text-white`}
      >
        <Providers>{children}</Providers>
      </body>
      <GoogleAnalytics gaId={gaId} />
    </html>
  );
}

