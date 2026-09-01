import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { PwaRegister } from "@/components/pwa/pwa-register";

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

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kraftaura.in"),
  applicationName: "Kraftaura",
  title: {
    default: "Kraftaura – Online Store Builder for Small Businesses in India",
    template: "%s | Kraftaura",
  },
  description:
    "Create your online store in minutes with Kraftaura. Sell through WhatsApp, accept online payments, manage products and grow your small business in India.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kraftaura",
  },
  formatDetection: {
    telephone: true,
  },
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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>
      </head>
      <body
        className={`${headingFont.variable} ${bodyFont.variable} [--font-brand:var(--font-heading)] bg-[#080808] text-white antialiased min-h-screen selection:bg-maroon-800/80 selection:text-white overflow-x-hidden`}
      >
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
