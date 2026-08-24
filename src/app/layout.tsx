import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
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
  title: "Catalog Platform | Enterprise Multi-Tenant SaaS",
  description: "Next-generation multi-tenant catalog store builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body
        className={`${headingFont.variable} ${bodyFont.variable} bg-[#080808] text-white antialiased min-h-screen selection:bg-maroon-800/80 selection:text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
