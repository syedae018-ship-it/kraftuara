"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse, successResponse, getErrorMessage } from "@/lib/api-response";
import { ActionResponse, UserProfile } from "@/types";

import { isAdminUser } from "@/lib/services/admin-roles";

/**
 * Sign in user with email and password
 */
export async function signInWithEmailAction(formData: FormData): Promise<ActionResponse<void>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return errorResponse("Email and password are required.");
  }

  let redirectPath: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return errorResponse(error.message);
    }

    if (isAdminUser(email)) {
      redirectPath = "/admin";
    } else {
      redirectPath = "/dashboard";
    }
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
  return successResponse(undefined, "Signed in successfully.");
}


/**
 * Register new user with email, password, and full name
 */
export async function signUpWithEmailAction(formData: FormData): Promise<ActionResponse<{ requiresVerification: boolean }>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password || !fullName) {
    return errorResponse("All fields are required.");
  }

  if (password.length < 6) {
    return errorResponse("Password must be at least 6 characters long.");
  }

  let redirectPath: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return errorResponse(error.message);
    }

    // Redirect directly to plan selection
    redirectPath = "/choose-plan";
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
  return successResponse({ requiresVerification: false }, "Account created successfully.");
}

/**
 * Initiate Google OAuth authentication
 */
export async function signInWithGoogleAction(): Promise<ActionResponse<{ url: string }>> {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error || !data.url) {
      return errorResponse(error?.message || "Failed to initialize Google OAuth.");
    }

    return successResponse({ url: data.url });
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Request password reset email
 */
export async function forgotPasswordAction(formData: FormData): Promise<ActionResponse<void>> {
  const email = formData.get("email") as string;

  if (!email) {
    return errorResponse("Email address is required.");
  }

  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse(undefined, "Password reset instructions sent to your email.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Reset user password with token session
 */
export async function resetPasswordAction(formData: FormData): Promise<ActionResponse<void>> {
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return errorResponse("Password must be at least 6 characters long.");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse(undefined, "Password updated successfully.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Sign out current user session
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Get current authenticated user profile
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await (supabase.from("profiles") as any)
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email || "",
      fullName: profile?.full_name || user.user_metadata?.full_name || "User",
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
    };
  } catch {
    return null;
  }
}
