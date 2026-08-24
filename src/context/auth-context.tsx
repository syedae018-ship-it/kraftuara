"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAdminUser } from "@/lib/services/admin-roles";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

export type DummyUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  emailVerified?: boolean;
  selectedTemplate?: string;
  onboardingComplete?: boolean;
};

export type DummyStore = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  category?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  userId?: string;
};

type AuthContextType = {
  user: DummyUser;
  activeStore: DummyStore;
  stores: DummyStore[];
  switchStore: (storeId: string) => void;
  signUp: (name: string, email: string, password: string, businessName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ role: "admin" | "merchant" }>;
  createStore: (
    storeName: string,
    storeSlug: string,
    category: string,
    logoUrl?: string,
    primaryColor?: string,
    secondaryColor?: string
  ) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  resendEmailOtp: (email: string) => Promise<void>;
  verifyEmail: () => void;
  selectPlan: (planName: string, status?: "active" | "payment_pending") => void;
  selectTemplate: (templateId: string) => void;
  completeStoreWizard: (storeData: Partial<DummyStore> & {
    storeName: string;
    storeSlug?: string;
    category?: string;
    tagline?: string;
    aboutText?: string;
    accentColor?: string;
    headingFont?: string;
    bodyFont?: string;
    whatsapp?: string;
    phone?: string;
    email?: string;
    address?: string;
    instagram?: string;
    facebook?: string;
    logoFile?: File | null;
  }) => Promise<void>;
  isImpersonating: boolean;
  impersonatorUser: DummyUser | null;
  impersonate: (merchantUser: any) => void;
  stopImpersonating: () => void;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function DummyAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<DummyUser>(null as any);
  const [stores, setStores] = useState<DummyStore[]>([]);
  const [activeStore, setActiveStore] = useState<DummyStore>(null as any);
  
  const [impersonatorUser, setImpersonatorUser] = useState<DummyUser | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getSession = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const u = session.user;
        const profile = {
          id: u.id,
          name: u.user_metadata?.full_name || u.email?.split("@")[0] || "User",
          email: u.email || "",
          avatar: u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.email || "")}`,
          plan: "free",
          storeId: "",
          storeName: "",
          storeSlug: "",
        };

        const { data: userStores, error } = await supabase
          .from("stores")
          .select("*, subscriptions(plan, status)")
          .eq("user_id", u.id);

        if (error) {
          console.error("Failed to load stores:", error);
          setUser(profile as any);
          setStores([]);
          setActiveStore(null as any);
          setIsLoading(false);
          return;
        }

        if (userStores && userStores.length > 0) {
          const mappedStores: DummyStore[] = userStores.map((s: any) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            plan: s.subscriptions?.[0]?.status === "active" ? (s.subscriptions?.[0]?.plan || "free") : "free",
            category: s.category || "",
            logoUrl: s.logo_url || "",
            primaryColor: s.primary_color || "",
            secondaryColor: s.secondary_color || "",
          }));
          setStores(mappedStores);

          const savedActiveStoreId = localStorage.getItem("symar_active_store_id");
          const found = mappedStores.find((s) => s.id === savedActiveStoreId);
          const currentStore = found || mappedStores[0];
          setActiveStore(currentStore);

          profile.storeId = currentStore.id;
          profile.storeName = currentStore.name;
          profile.storeSlug = currentStore.slug;
          profile.plan = currentStore.plan;
          setUser(profile as any);
          // Redirect handled by separate useEffect
        } else {
          setStores([]);
          setActiveStore(null as any);
          setUser(profile as any);
        }
      } else {
        setUser(null as any);
        setStores([]);
        setActiveStore(null as any);
      }
    } catch (e) {
      console.error("Supabase auth session load failed:", e);
      setUser(null as any);
      setStores([]);
      setActiveStore(null as any);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        getSession();
      } else if (event === "SIGNED_OUT") {
        setUser(null as any);
        setStores([]);
        setActiveStore(null as any);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Dedicated lightweight routing/redirection watcher
  useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = pathname
      ? pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/create-store") ||
        pathname.startsWith("/choose-plan") ||
        pathname.startsWith("/choose-template")
      : false;

    if (isProtectedRoute && !user) {
      router.push("/login");
      return;
    }

    const isAdmin = user && isAdminUser(user.email);
    if (user && stores.length === 0 && !isAdmin) {
      if (
        pathname &&
        !pathname.startsWith("/choose-plan") &&
        !pathname.startsWith("/choose-template") &&
        !pathname.startsWith("/create-store") &&
        !pathname.startsWith("/login") &&
        !pathname.startsWith("/signup") &&
        !pathname.startsWith("/verify-email")
      ) {
        router.push("/choose-plan");
      }
    }
  }, [user, stores, pathname, isLoading, router]);

  const verifyEmailOtp = async (email: string, token: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });
      if (error) throw error;
      await getSession();
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  };

  const switchStore = (storeId: string) => {
    const found = stores.find((s) => s.id === storeId);
    if (found) {
      setActiveStore(found);
      localStorage.setItem("symar_active_store_id", found.id);
      if (user) {
        setUser({
          ...user,
          storeId: found.id,
          storeName: found.name,
          storeSlug: found.slug,
          plan: found.plan,
        });
      }
    }
  };

  const signUp = async (name: string, email: string, password: string, businessName: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      localStorage.setItem("symar_pending_store_name", businessName);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const isAdmin = isAdminUser(email);
      return { role: (isAdmin ? "admin" : "merchant") as "admin" | "merchant" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem("symar_active_store_id");
    setUser(null as any);
    setStores([]);
    setActiveStore(null as any);
    setIsLoading(false);
    router.push("/login");
  };

  const createStore = async () => {}; // Used in older flow
  const verifyEmail = () => {};
  const selectPlan = () => {};
  const selectTemplate = () => {};
  const completeStoreWizard = async (storeData: any) => {
    setIsLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("User not authenticated");

      // Generate slug if not provided
      const slug = storeData.storeSlug || storeData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // Check slug uniqueness manually? (Optional, but Supabase unique constraint will catch it)

      // Upload logo if provided
      let logoUrl = storeData.logoUrl || "";
      if (storeData.logoFile) {
        const fileExt = storeData.logoFile.name.split(".").pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${slug}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("store_assets").upload(filePath, storeData.logoFile);
        if (uploadError) {
          console.error("Logo upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage.from("store_assets").getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      // 1. Create Store
      const { data: store, error: storeError } = await (supabase.from("stores") as any).insert({
        user_id: currentUser.id,
        name: storeData.storeName,
        slug: slug,
        logo_url: logoUrl,
        primary_color: storeData.accentColor || "#F97316",
        secondary_color: "#F4F4F5",
        is_published: true,
      }).select().single();

      if (storeError) throw storeError;

      // 2. Add default appearance settings
      const appearanceData = {
        store_id: store.id,
        theme_id: "bloom",
        branding: {
          name: storeData.storeName,
          tagline: storeData.tagline || "",
          description: storeData.aboutText || "",
          logoUrl: logoUrl,
          whatsapp: storeData.whatsapp || "",
          phone: storeData.phone || "",
          email: storeData.email || "",
          address: storeData.address || "",
          instagram: storeData.instagram || "",
          facebook: storeData.facebook || "",
        },
        colors: {
          primary: "#18181B",
          secondary: "#F4F4F5",
          accent: storeData.accentColor || "#F97316",
          background: "#FFFFFF",
        },
        typography: {
          headingFont: storeData.headingFont || "Helvetica Neue",
          bodyFont: storeData.bodyFont || "Inter",
          animationStyle: "smooth",
        },
      };

      const { error: appError } = await (supabase.from("appearance_settings") as any).insert(appearanceData);
      if (appError) console.error("Appearance creation error:", appError);

      // 3. Subscription (default free)
      const selectedPlan = localStorage.getItem("symar_selected_plan") || "free";
      const { error: subError } = await (supabase.from("subscriptions") as any).insert({
        store_id: store.id,
        user_id: currentUser.id,
        plan: selectedPlan,
        status: "active",
      });
      if (subError) console.error("Subscription creation error:", subError);

      // Finish by refreshing session
      await getSession();
      router.push("/dashboard");
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
  };

  const impersonate = () => {};
  const stopImpersonating = () => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        activeStore,
        stores,
        switchStore,
        signUp,
        login,
        createStore,
        verifyEmailOtp,
        resendEmailOtp,
        verifyEmail,
        selectPlan,
        selectTemplate,
        completeStoreWizard,
        isImpersonating,
        impersonatorUser,
        impersonate,
        stopImpersonating,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a DummyAuthProvider");
  }
  return context;
}
