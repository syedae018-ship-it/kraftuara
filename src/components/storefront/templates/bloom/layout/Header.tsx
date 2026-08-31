"use client";

import { useCart } from "@/context/CartContext";
import { Menu, Search, ShoppingCart, X, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { getStoreBasePath } from "@/lib/urls";
import { StoreData } from "@/types/store";
import { resolveImageUrl } from "@/lib/image-resolver";
import { hasFeatureAccess } from "@/lib/feature-gating";

export default function Header({ store, isSubdomain = false }: { store: StoreData; isSubdomain?: boolean }) {
  const { cart } = useCart();
  const cartCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const basePath = getStoreBasePath(store.slug, isSubdomain);
  const homeLink = basePath || "/";
  const contactLink = `${basePath}/contact`;
  const cartLink = `${basePath}/cart`;
  const trackLink = `${basePath}/track`;

  const isActivePath = (path: string) => pathname === path || (path === "/" && pathname === basePath);

  const canTrackOrders = hasFeatureAccess(store.plan || "startup", "customer_order_tracking");

  const navItems = [
    ...(canTrackOrders ? [{ href: trackLink, label: "Track Order" }] : []),
    { href: contactLink, label: "Contact" },
  ];



  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 bg-[var(--bloom-background)]/90 backdrop-blur-xl border-b border-[var(--bloom-border)] ${
        isScrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 lg:space-x-12">
            <Link
              className="text-lg sm:text-2xl tracking-tight text-bloom-foreground hover:opacity-80 transition-opacity font-bold font-heading flex items-center gap-2 min-w-0"
              href={homeLink}
              aria-label={`${store.name} Home`}
            >
              {store.appearance.branding.logoUrl && !logoError ? (
                <img
                  src={resolveImageUrl(store.appearance.branding.logoUrl)}
                  alt={store.name}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                {store.name.toUpperCase()}
              </span>
            </Link>

            <nav
              className="hidden md:flex items-center space-x-1"
              role="navigation"
              aria-label="Main navigation"
            >
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePath(href)
                      ? "bg-bloom-accent text-bloom-primary shadow-sm"
                      : "text-bloom-foreground hover:bg-bloom-secondary hover:text-bloom-primary"
                  }`}
                  aria-current={isActivePath(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {canTrackOrders && (
              <Link
                href={trackLink}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-sm hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: "var(--color-surface, var(--bloom-background))",
                  borderColor: "var(--color-border, var(--bloom-border))",
                  color: "var(--color-text-primary, var(--bloom-foreground))",
                }}
                aria-label="Track Order"
              >
                <Truck className="w-3.5 h-3.5" style={{ color: "var(--color-primary, var(--bloom-primary))" }} />
                <span>Track Order</span>
              </Link>
            )}

            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-full hover:bg-bloom-secondary transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? (
                <X className="h-6 w-6 text-bloom-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-bloom-foreground" />
              )}
            </button>

            <Link
              href={cartLink}
              className="relative p-2 rounded-full hover:bg-bloom-secondary transition-all duration-200 group"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-6 w-6 text-bloom-foreground group-hover:text-bloom-primary transition-colors" />
              {cartCount > 0 && (
                <span
                  style={{ backgroundColor: "var(--color-cta)", color: "var(--color-cta-foreground)" }}
                  className="absolute -top-1 -right-1 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {isMobileOpen && (
          <nav
            className="md:hidden mt-4 animate-in slide-in-from-top duration-200"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-2 pb-4 border-b border-bloom-border">
              {canTrackOrders && (
                <Link
                  key="mobile-track-order"
                  href={trackLink}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all"
                  style={{
                    backgroundColor: isActivePath(trackLink) ? "var(--color-primary)" : "var(--color-surface)",
                    color: isActivePath(trackLink) ? "var(--color-primary-foreground)" : "var(--color-text-primary)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Order</span>
                </Link>
              )}
              {navItems.filter((i) => i.href !== trackLink).map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className={`text-sm font-medium py-2 px-3 rounded-lg transition-all ${
                    isActivePath(href)
                      ? "bg-bloom-accent text-bloom-primary"
                      : "text-bloom-foreground hover:text-bloom-primary hover:bg-bloom-secondary"
                  }`}
                  aria-current={isActivePath(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
