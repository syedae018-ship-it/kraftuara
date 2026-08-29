/**
 * Admin Security & Authorization Guard
 * Enforces server-side authentication and role verification for all admin operations.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/services/admin-roles";

export interface AdminAuthSession {
  adminId: string;
  adminEmail: string;
  adminName: string;
  supabase: any;
}

/**
 * Asserts that the incoming request is executed by an authorized Platform Administrator.
 * Throws an error or returns the authenticated session context.
 */
export async function assertAdminSession(customClient?: any): Promise<AdminAuthSession> {
  const supabase = customClient || (await createServerSupabaseClient());
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: Active admin authentication session required.");
  }

  const email = user.email || "";
  const role = (user.user_metadata?.role as string) || (user.app_metadata?.role as string) || null;

  if (!isAdminUser(email, role)) {
    console.warn(`[Security Alert] Non-admin access attempt blocked for user: ${email} (${user.id})`);
    throw new Error("Forbidden: Access denied. Platform administrator privileges required.");
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0] || "Admin";

  return {
    adminId: user.id,
    adminEmail: email,
    adminName: name,
    supabase,
  };
}
