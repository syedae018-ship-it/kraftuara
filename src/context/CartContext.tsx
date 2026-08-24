"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string; // Dynamic Symar UUID string
  name: string;
  price: number;
  image: string;
  quantity: number;
  sku?: string;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider = ({ children, storeSlug }: { children: React.ReactNode; storeSlug: string }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const localStorageKey = `symar_cart_${storeSlug}`;

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(localStorageKey);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart JSON", e);
      }
    }
    setIsLoaded(true);
  }, [localStorageKey]);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(localStorageKey, JSON.stringify(cart));
    }
  }, [cart, localStorageKey, isLoaded]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const addedQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + addedQty }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity: addedQty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(localStorageKey);
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
