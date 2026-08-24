"use client";

import { useState, useCallback, useEffect } from "react";
import { ToastItem, ToastVariant } from "@/types";

type ToastListener = (toasts: ToastItem[]) => void;

let toastsMemory: ToastItem[] = [];
let listeners: ToastListener[] = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toastsMemory]));
};

export const toast = {
  show: (title: string, options?: { description?: React.ReactNode; variant?: ToastVariant; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      title,
      description: options?.description,
      variant: options?.variant || "default",
      duration: options?.duration ?? 4000,
    };
    toastsMemory = [newToast, ...toastsMemory];
    notifyListeners();
    return id;
  },
  success: (title: string, description?: React.ReactNode) => {
    return toast.show(title, { description, variant: "success" });
  },
  error: (title: string, description?: React.ReactNode) => {
    return toast.show(title, { description, variant: "error" });
  },
  warning: (title: string, description?: React.ReactNode) => {
    return toast.show(title, { description, variant: "warning" });
  },
  info: (title: string, description?: React.ReactNode) => {
    return toast.show(title, { description, variant: "info" });
  },
  dismiss: (id: string) => {
    toastsMemory = toastsMemory.filter((t) => t.id !== id);
    notifyListeners();
  },
  clear: () => {
    toastsMemory = [];
    notifyListeners();
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(toastsMemory);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: toast.dismiss,
  };
}
