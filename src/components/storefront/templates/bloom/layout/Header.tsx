"use client";

import { useCart } from "@/context/CartContext";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { getStoreBasePath } from "@/lib/urls";
import { StoreData } from "@/types/store";

export default function Header({ store, isSubdomain = false }: { store: StoreData; isSubdomain?: boolean }) {
  const { cart } = useCart();
  const cartCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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

  const isActivePath = (path: string) => pathname === path || (path === "/" && pathname === basePath);

  const navItems = [{ href: contactLink, label: "Contact" }];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-bloom-border shadow-lg"
          : "bg-white/80 backdrop-blur-md border-b border-bloom-border shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 lg:space-x-12">
            <Link
              className="text-2xl tracking-tight text-bloom-foreground hover:text-bloom-muted transition-colors font-bold font-heading flex items-center gap-2"
              href={homeLink}
              aria-label={`${store.name} Home`}
            >
              {store.appearance.branding.logoUrl ? (
                <img
                  src={store.appearance.branding.logoUrl}
                  alt={store.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: store.appearance.colors.primary || "#F97316" }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <span>
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

          <div className="flex items-center space-x-2 sm:space-x-4">
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
                  className="absolute -top-1 -right-1 bg-bloom-primary text-bloom-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                  aria-label={`${cartCount} items in cart`}
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
            <div className="flex flex-col space-y-3 pb-4 border-b border-bloom-border">
              {navItems.map(({ href, label }) => (
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
