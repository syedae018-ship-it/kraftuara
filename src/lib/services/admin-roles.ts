/**
 * Admin Role & Authorization Architecture
 * Supports configurable admin emails and role-based checks.
 */

export interface AdminRoleConfig {
  adminEmails: string[];
}

export const ADMIN_CONFIG: AdminRoleConfig = {
  adminEmails: [
    "syed.ae018@gmail.com",
  ],
};

/**
 * Checks if a user email or explicit role qualifies as an Admin Account
 */
export function isAdminUser(email?: string | null, role?: string | null): boolean {
  if (!email && !role) return false;

  // 1. Role-based check
  if (role && (role === "admin" || role === "super_admin")) {
    return true;
  }

  // 2. Configurable email check (environment variable override or static config)
  const envAdminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];

  const allAdminEmails = [
    ...ADMIN_CONFIG.adminEmails.map((e) => e.toLowerCase()),
    ...envAdminEmails,
  ];

  if (email && allAdminEmails.includes(email.toLowerCase())) {
    return true;
  }

  return false;
}
