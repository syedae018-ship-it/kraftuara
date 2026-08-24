"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types/product";

export type ThemePresetKey = "luxury" | "modern" | "creative" | "custom";
export type TypographyPresetKey = "serif_luxury" | "modern_sans" | "editorial_italic" | "mono_code";
export type BorderRadiusKey = "none" | "soft" | "rounded" | "full";
export type ButtonStyleKey = "pill" | "rounded" | "sharp" | "outline";
export type LayoutWidthKey = "container" | "full" | "compact";

export interface DemoThemeConfig {
  preset: ThemePresetKey;
  mode: "dark" | "light";
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  typography: TypographyPresetKey;
  borderRadius: BorderRadiusKey;
  buttonStyle: ButtonStyleKey;
  layoutWidth: LayoutWidthKey;
  storeTitle: string;
  animations: boolean;
}

export interface DemoCartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface DemoContextType {
  themeConfig: DemoThemeConfig;
  updateThemeConfig: (partial: Partial<DemoThemeConfig>) => void;
  resetThemeConfig: (presetKey: ThemePresetKey) => void;
  cart: DemoCartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartSubtotal: number;
  customizationOpen: boolean;
  setCustomizationOpen: (open: boolean) => void;
}

export const presetDefaults: Record<ThemePresetKey, DemoThemeConfig> = {
  luxury: {
    preset: "luxury",
    mode: "dark",
    primaryColor: "#E67E22", // Warm amber / orange accent
    secondaryColor: "#111111",
    accentColor: "#D4AF37", // Gold accent
    typography: "serif_luxury",
    borderRadius: "soft",
    buttonStyle: "rounded",
    layoutWidth: "container",
    storeTitle: "Aroma Perfumes",
    animations: true,
  },
  modern: {
    preset: "modern",
    mode: "light",
    primaryColor: "#0070F3", // Soft blue
    secondaryColor: "#F8FAFC",
    accentColor: "#0EA5E9",
    typography: "modern_sans",
    borderRadius: "rounded",
    buttonStyle: "pill",
    layoutWidth: "container",
    storeTitle: "Tech Haven",
    animations: true,
  },
  creative: {
    preset: "creative",
    mode: "light",
    primaryColor: "#8B5CF6", // Creative purple
    secondaryColor: "#FAF9F6", // Cream
    accentColor: "#EC4899",
    typography: "editorial_italic",
    borderRadius: "none",
    buttonStyle: "sharp",
    layoutWidth: "full",
    storeTitle: "Creative Threads",
    animations: true,
  },
  custom: {
    preset: "custom",
    mode: "dark",
    primaryColor: "#E67E22",
    secondaryColor: "#111111",
    accentColor: "#D4AF37",
    typography: "serif_luxury",
    borderRadius: "soft",
    buttonStyle: "rounded",
    layoutWidth: "container",
    storeTitle: "My Custom Store",
    animations: true,
  },
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({
  children,
  initialTheme = "luxury",
}: {
  children: React.ReactNode;
  initialTheme?: ThemePresetKey;
}) {
  const [themeConfig, setThemeConfig] = useState<DemoThemeConfig>(
    presetDefaults[initialTheme] || presetDefaults.luxury
  );
  const [cart, setCart] = useState<DemoCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);

  // Sync initial theme when initialTheme prop changes
  useEffect(() => {
    if (presetDefaults[initialTheme]) {
      setThemeConfig(presetDefaults[initialTheme]);
    }
  }, [initialTheme]);

  const updateThemeConfig = (partial: Partial<DemoThemeConfig>) => {
    setThemeConfig((prev) => ({
      ...prev,
      ...partial,
      preset: partial.preset || "custom",
    }));
  };

  const resetThemeConfig = (presetKey: ThemePresetKey) => {
    if (presetDefaults[presetKey]) {
      setThemeConfig(presetDefaults[presetKey]);
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: `cart-${product.id}`, product, quantity }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <DemoContext.Provider
      value={{
        themeConfig,
        updateThemeConfig,
        resetThemeConfig,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartItemCount,
        cartSubtotal,
        customizationOpen,
        setCustomizationOpen,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
