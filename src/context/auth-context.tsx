"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAdminUser } from "@/lib/services/admin-roles";
import { createClient } from "@/lib/supabase/client";
import { normalizeSlug } from "@/lib/urls";
import { appearanceRepository } from "@/lib/repositories/appearance-repository";

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

export type LoginResult = {
  role: "admin" | "merchant";
  hasStores: boolean;
  user: DummyUser | null;
};

type AuthContextType = {
  user: DummyUser;
  activeStore: DummyStore;
  stores: DummyStore[];
  switchStore: (storeId: string) => void;
  signUp: (name: string, email: string, password: string, businessName: string) => Promise<{ user: any; hasSession: boolean }>;
  login: (email: string, password: string) => Promise<LoginResult>;
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
  }) => Promise<any>;
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

  const getSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const u = session.user;
        const profile: DummyUser = {
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User",
          email: u.email || "",
          avatar: u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.email || "")}`,
          plan: "startup",
          storeId: "",
          storeName: "",
          storeSlug: "",
        };

        const { data: userStores, error } = await supabase
          .from("stores")
          .select("*, subscriptions(plan, status)")
          .eq("user_id", u.id);

        if (error) {
          console.error("Failed to load stores for user:", error);
          setUser(profile);
          setStores([]);
          setActiveStore(null as any);
          setIsLoading(false);
          return { user: profile, stores: [], activeStore: null };
        }

        if (userStores && userStores.length > 0) {
          const mappedStores: DummyStore[] = userStores.map((s: any) => {
            const rawPlan = s.subscriptions?.[0]?.status === "active" ? (s.subscriptions?.[0]?.plan || "startup") : "startup";
            const plan = ["startup", "growth", "pro"].includes(rawPlan) ? rawPlan : "startup";
            return {
              id: s.id,
              name: s.name,
              slug: s.slug,
              plan,
              category: s.category || "",
              logoUrl: s.logo_url || "",
              primaryColor: s.primary_color || "",
              secondaryColor: s.secondary_color || "",
              userId: s.user_id,
            };
          });
          setStores(mappedStores);

          const savedActiveStoreId = typeof window !== "undefined" ? localStorage.getItem("symar_active_store_id") : null;
          const found = mappedStores.find((s) => s.id === savedActiveStoreId);
          const currentStore = found || mappedStores[0];
          setActiveStore(currentStore);

          profile.storeId = currentStore.id;
          profile.storeName = currentStore.name;
          profile.storeSlug = currentStore.slug;
          profile.plan = currentStore.plan;
          setUser(profile);
          setIsLoading(false);
          return { user: profile, stores: mappedStores, activeStore: currentStore };
        } else {
          setStores([]);
          setActiveStore(null as any);
          setUser(profile);
          setIsLoading(false);
          return { user: profile, stores: [], activeStore: null };
        }
      } else {
        setUser(null as any);
        setStores([]);
        setActiveStore(null as any);
        setIsLoading(false);
        return { user: null, stores: [], activeStore: null };
      }
    } catch (e) {
      console.error("Supabase auth session load failed:", e);
      setUser(null as any);
      setStores([]);
      setActiveStore(null as any);
      setIsLoading(false);
      return { user: null, stores: [], activeStore: null };
    }
  }, [supabase]);

  useEffect(() => {
    // Session Lifecycle Enforcement (Remember Me and Tab Session expiration checks)
    if (typeof window !== "undefined") {
      const rememberMe = localStorage.getItem("symar_remember_me") === "true";
      
      if (rememberMe) {
        const loginTime = localStorage.getItem("symar_session_login_time");
        if (loginTime) {
          const diffMs = Date.now() - Number(loginTime);
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (diffMs > sevenDaysMs) {
            supabase.auth.signOut();
            localStorage.removeItem("symar_session_login_time");
            localStorage.removeItem("symar_remember_me");
          }
        }
      } else {
        const hasTabSession = sessionStorage.getItem("symar_tab_session") === "true";
        if (!hasTabSession) {
          supabase.auth.signOut();
        }
      }
      sessionStorage.setItem("symar_tab_session", "true");
    }

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
  }, [getSession, supabase]);

  // Dedicated route protection watcher
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

  const signUp = async (name: string, email: string, password: string, businessName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
          },
        },
      });
      if (error) throw error;

      if (typeof window !== "undefined") {
        localStorage.setItem("symar_pending_store_name", businessName);
      }

      if (data.session) {
        await getSession();
      }

      return { user: data.user, hasSession: !!data.session };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (typeof window !== "undefined") {
        const rememberMe = localStorage.getItem("symar_remember_me") === "true";
        if (rememberMe) {
          localStorage.setItem("symar_session_login_time", Date.now().toString());
        } else {
          localStorage.removeItem("symar_session_login_time");
        }
      }

      const sessionData = await getSession();
      const isAdmin = isAdminUser(email);

      return {
        role: (isAdmin ? "admin" : "merchant") as "admin" | "merchant",
        hasStores: (sessionData?.stores?.length ?? 0) > 0,
        user: sessionData?.user ?? null,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("symar_active_store_id");
        localStorage.removeItem("symar_selected_plan");
        localStorage.removeItem("symar_selected_template");
        localStorage.removeItem("symar_pending_store_name");
      }
      setUser(null as any);
      setStores([]);
      setActiveStore(null as any);
    } finally {
      setIsLoading(false);
      router.push("/login");
    }
  };

  const switchStore = (storeId: string) => {
    const found = stores.find((s) => s.id === storeId);
    if (found) {
      setActiveStore(found);
      if (typeof window !== "undefined") {
        localStorage.setItem("symar_active_store_id", found.id);
      }
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

  const createStore = async (
    storeName: string,
    storeSlug: string,
    category: string,
    logoUrl?: string,
    primaryColor?: string,
    secondaryColor?: string
  ) => {
    setIsLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("User not authenticated");

      let cleanSlug = normalizeSlug(storeSlug);
      if (!cleanSlug || cleanSlug.length < 3) {
        throw new Error("Slug must be at least 3 characters.");
      }

      if (activeStore?.id) {
        // Update existing store
        const { error } = await (supabase.from("stores") as any)
          .update({
            name: storeName,
            slug: cleanSlug,
            logo_url: logoUrl || null,
            primary_color: primaryColor || "#800020",
            secondary_color: secondaryColor || "#111111",
            category: category,
          })
          .eq("id", activeStore.id);

        if (error) throw error;
        
        // Also update appearance settings name & logoUrl
        const settings = await appearanceRepository.getSettings(activeStore.id);
        await appearanceRepository.updateSettings(activeStore.id, {
          branding: {
            ...settings.branding,
            name: storeName,
            logoUrl: logoUrl || undefined,
          },
          colors: {
            ...settings.colors,
            primary: primaryColor || settings.colors.primary,
            secondary: secondaryColor || settings.colors.secondary,
          }
        });
      } else {
        // Create new store
        const { data: store, error: storeError } = await (supabase.from("stores") as any).insert({
          user_id: currentUser.id,
          name: storeName,
          slug: cleanSlug,
          logo_url: logoUrl || null,
          primary_color: primaryColor || "#800020",
          secondary_color: secondaryColor || "#111111",
          category: category,
          is_published: true,
        }).select().single();

        if (storeError) throw storeError;
      }
      
      await getSession();
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  const verifyEmail = () => {};
  const selectPlan = (planName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("symar_selected_plan", planName);
    }
  };
  const selectTemplate = (templateId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("symar_selected_template", templateId);
    }
  };

  const completeStoreWizard = async (storeData: any) => {
    setIsLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("User not authenticated");

      // Generate slug if not provided
      let slug = normalizeSlug(storeData.storeSlug || storeData.storeName);
      if (!slug || slug.length < 3) slug = `store-${Date.now().toString(36)}`;

      // Check slug uniqueness
      const { data: existingStore } = await (supabase.from("stores") as any)
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingStore) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }

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
        primary_color: storeData.accentColor || "#800020",
        secondary_color: "#111111",
        is_published: true,
      }).select().single();

      if (storeError) throw storeError;

      // 2. Add appearance settings
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
          accent: storeData.accentColor || "#800020",
          background: "#FFFFFF",
        },
        typography: {
          headingFont: storeData.headingFont || "Plus Jakarta Sans",
          bodyFont: storeData.bodyFont || "Inter",
          animationStyle: "smooth",
        },
      };

      const { error: appError } = await (supabase.from("appearance_settings") as any).insert(appearanceData);
      if (appError) console.error("Appearance creation error:", appError);

      // 3. Add default category
      await (supabase.from("categories") as any).insert({
        store_id: store.id,
        name: "Featured",
        slug: "featured",
        is_published: true,
        display_order: 1,
      });

      // 4. Secure Subscription Setup
      const selectedPlan = (typeof window !== "undefined" && localStorage.getItem("symar_selected_plan")) || "startup";
      const rzpSubId = typeof window !== "undefined" ? localStorage.getItem("symar_checkout_subscription_id") : null;
      const rzpPaymentId = typeof window !== "undefined" ? localStorage.getItem("symar_checkout_payment_id") : null;
      const rzpSignature = typeof window !== "undefined" ? localStorage.getItem("symar_checkout_signature") : null;

      const { activatePlatformSubscriptionAction } = await import("@/lib/actions/payment");
      const subRes = await activatePlatformSubscriptionAction(store.id, selectedPlan as any, {
        subscriptionId: rzpSubId,
        paymentId: rzpPaymentId,
        signature: rzpSignature,
      });

      if (!subRes.success) {
        console.error("Subscription activation failed during store setup:", subRes.error);
      }

      // Clean up localStorage checkout credentials
      if (typeof window !== "undefined") {
        localStorage.removeItem("symar_checkout_subscription_id");
        localStorage.removeItem("symar_checkout_payment_id");
        localStorage.removeItem("symar_checkout_signature");
      }

      // Save active store ID immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("symar_active_store_id", store.id);
      }

      // Finish by refreshing session
      await getSession();

      return store;
    } finally {
      setIsLoading(false);
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
