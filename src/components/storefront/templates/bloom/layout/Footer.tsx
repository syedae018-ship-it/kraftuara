"use client";

import {
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { getStoreBasePath } from "@/lib/urls";
import { StoreData } from "@/types/store";

export default function Footer({ store, isSubdomain = false }: { store: StoreData; isSubdomain?: boolean }) {
  const { branding } = store.appearance;
  const basePath = getStoreBasePath(store.slug, isSubdomain);
  const homeLink = basePath || "/";
  const contactLink = `${basePath}/contact`;
  const cartLink = `${basePath}/cart`;

  const navLinks = [
    { href: homeLink, label: "Store Home" },
    { href: `${homeLink}#products`, label: "All Products" },
    { href: cartLink, label: "Shopping Cart" },
    { href: contactLink, label: "Contact Us" },
  ];

  return (
    <footer className="bg-bloom-background border-t border-bloom-border text-bloom-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand column */}
            <div className="lg:col-span-3 space-y-4">
              <Link
                className="text-2xl tracking-tight text-bloom-foreground hover:text-bloom-muted transition-colors font-bold font-heading"
                href={homeLink}
                aria-label={`${store.name} Home`}
              >
                {store.name.toUpperCase()}
              </Link>
              {branding.description && (
                <p className="text-bloom-muted max-w-sm text-sm">
                  {branding.description}
                </p>
              )}

              {/* Social icons — only shown when configured */}
              {(branding.facebook || branding.instagram) && (
                <div className="flex gap-2">
                  {branding.facebook && (
                    <a
                      href={branding.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-bloom-secondary text-bloom-foreground transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {branding.instagram && (
                    <a
                      href={branding.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-bloom-secondary text-bloom-foreground transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Contact column — only rendered if any contact info exists */}
            {(branding.address || branding.phone || branding.whatsapp || branding.email) && (
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-sm font-semibold text-bloom-foreground mb-4 uppercase tracking-wider">
                  Contact
                </h4>
                <div className="space-y-3 text-sm text-bloom-muted">
                  {branding.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-bloom-primary shrink-0 mt-0.5" />
                      <span>{branding.address}</span>
                    </div>
                  )}
                  {(branding.whatsapp || branding.phone) && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-bloom-primary shrink-0" />
                      <span>{branding.whatsapp || branding.phone}</span>
                    </div>
                  )}
                  {branding.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-bloom-primary shrink-0" />
                      <span>{branding.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation column */}
            <div className="lg:col-span-1">
              <h4 className="text-sm font-semibold text-bloom-foreground mb-4 uppercase tracking-wider">
                Navigation
              </h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-bloom-muted hover:text-bloom-foreground transition-colors inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-0 bg-bloom-border" />

        <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-bloom-muted text-sm">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {store.name}. Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Powered by Symar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
