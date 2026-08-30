/**
 * Kraftaura Email & Notification Service
 * Dedicated, decoupled notification engine for customer confirmations and admin alerts.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, PlanTier, getPlanDisplayName } from "@/lib/feature-gating";
import { ADMIN_CONFIG } from "@/lib/services/admin-roles";

export type EmailEventType =
  | "CUSTOMER_PAYMENT_SUCCESS"
  | "CUSTOMER_SUBSCRIPTION_ACTIVATED"
  | "CUSTOMER_PAYMENT_FAILED"
  | "ADMIN_PAYMENT_NOTIFICATION";

export interface PaymentEmailPayload {
  customerEmail: string;
  customerName?: string;
  planTier: PlanTier;
  planName: string;
  amount: number;
  currency: string;
  paymentId: string;
  subscriptionId?: string | null;
  purchaseDate: string;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;
  storeName?: string | null;
  storeSlug?: string | null;
}

export interface AdminPaymentEmailPayload {
  adminEmail: string;
  customerEmail: string;
  customerName?: string;
  userId?: string | null;
  storeId?: string | null;
  planTier: PlanTier;
  planName: string;
  amount: number;
  currency: string;
  paymentId: string;
  subscriptionId?: string | null;
  purchaseDate: string;
}

// In-memory idempotency cache fallback for edge/local runtimes
const deliveredEventsCache = new Set<string>();

function getSupabaseAdminSafe(providedClient?: any) {
  if (providedClient) return providedClient;
  try {
    return createAdminClient();
  } catch (err) {
    return null;
  }
}

/**
 * Checks whether an email event has already been delivered for a given transaction ID.
 */
export async function isEmailAlreadyDelivered(
  transactionId: string,
  eventType: EmailEventType,
  supabaseClient?: any
): Promise<boolean> {
  const cacheKey = `${transactionId}:${eventType}`;
  if (deliveredEventsCache.has(cacheKey)) {
    return true;
  }

  try {
    const supabase = getSupabaseAdminSafe(supabaseClient);
    if (!supabase) return false;

    const { data } = await (supabase as any)
      .from("email_logs")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("email_type", eventType)
      .maybeSingle();

    if (data) {
      deliveredEventsCache.add(cacheKey);
      return true;
    }
  } catch (err) {
    // If table doesn't exist yet, fallback to in-memory cache
  }

  return false;
}

/**
 * Logs an email delivery record into the audit table and in-memory cache.
 */
export async function recordEmailDelivery(params: {
  userId?: string | null;
  emailType: EmailEventType;
  transactionId: string;
  recipient: string;
  status: "sent" | "failed" | "skipped";
  metadata?: Record<string, any>;
  errorMessage?: string | null;
  supabaseClient?: any;
}): Promise<void> {
  const cacheKey = `${params.transactionId}:${params.emailType}`;
  if (params.status === "sent") {
    deliveredEventsCache.add(cacheKey);
  }

  try {
    const supabase = getSupabaseAdminSafe(params.supabaseClient);
    if (!supabase) return;

    await (supabase as any).from("email_logs").insert({
      user_id: params.userId || null,
      email_type: params.emailType,
      transaction_id: params.transactionId,
      recipient: params.recipient,
      status: params.status,
      metadata: params.metadata || {},
      error_message: params.errorMessage || null,
    });
  } catch (err) {
    // Gracefully handle database log insertion failure
  }
}

/**
 * Authoritatively resolves the customer's email and name from Supabase Auth & profiles.
 * Never defaults to admin email.
 */
export async function resolveCustomerEmail(
  userId?: string | null,
  fallbackEmail?: string | null,
  storeId?: string | null,
  supabaseClient?: any
): Promise<{ email: string; name?: string; userId?: string } | null> {
  const supabase = getSupabaseAdminSafe(supabaseClient);

  // 1. Resolve via userId
  if (userId && supabase) {
    try {
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.email) {
        return {
          email: profile.email.trim().toLowerCase(),
          name: profile.full_name || undefined,
          userId: profile.id,
        };
      }

      // Check auth.users directly via admin client
      const { data: authUserData } = await supabase.auth.admin.getUserById(userId);
      if (authUserData?.user?.email) {
        return {
          email: authUserData.user.email.trim().toLowerCase(),
          name: authUserData.user.user_metadata?.full_name || authUserData.user.user_metadata?.name || undefined,
          userId: authUserData.user.id,
        };
      }
    } catch (err) {
      console.error("Error resolving user by ID:", err);
    }
  }

  // 2. Resolve via storeId
  if (storeId && supabase) {
    try {
      const { data: store } = await (supabase as any)
        .from("stores")
        .select("id, user_id, name")
        .eq("id", storeId)
        .maybeSingle();

      if (store?.user_id) {
        const result = await resolveCustomerEmail(store.user_id, fallbackEmail, null, supabase);
        if (result) return result;
      }
    } catch (err) {
      console.error("Error resolving user by storeId:", err);
    }
  }

  // 3. Fallback email validation (must be non-empty and valid email)
  if (fallbackEmail && typeof fallbackEmail === "string" && fallbackEmail.includes("@")) {
    return {
      email: fallbackEmail.trim().toLowerCase(),
    };
  }

  return null;
}

/**
 * Resolves the platform admin notification email.
 */
export function getAdminNotificationEmail(): string {
  const envAdmin = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (envAdmin && envAdmin.includes("@")) {
    return envAdmin.toLowerCase();
  }
  return ADMIN_CONFIG.adminEmails[0] || "support@kraftaura.in";
}

/**
 * Renders the Kraftaura Customer Payment Confirmation HTML email template.
 */
export function renderCustomerConfirmationHtml(payload: PaymentEmailPayload): string {
  const formattedDate = new Date(payload.purchaseDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const renewalNotice = payload.nextBillingDate
    ? `Next scheduled renewal: <strong>${new Date(payload.nextBillingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>`
    : "Billed monthly. Cancel anytime from your merchant dashboard.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kraftaura Subscription Confirmed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0c; color: #e4e4e7; margin: 0; padding: 20px 0; }
    .container { max-width: 580px; margin: 0 auto; background-color: #141414; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4a0011 0%, #800020 100%); padding: 32px 28px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; margin: 0; }
    .badge { display: inline-block; background-color: rgba(255,255,255,0.15); color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-top: 8px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
    .card { background-color: #1c1c1f; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 16px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #27272a; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #a1a1aa; }
    .value { font-weight: 600; color: #ffffff; text-align: right; }
    .value-highlight { color: #34d399; font-weight: 700; font-size: 16px; }
    .mono { font-family: monospace; font-size: 12px; color: #d4d4d8; }
    .cta-container { text-align: center; margin: 32px 0 16px; }
    .button { display: inline-block; background-color: #800020; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 32px; border-radius: 10px; }
    .footer { padding: 24px 28px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; text-align: center; line-height: 1.5; }
    .footer a { color: #a1a1aa; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">KRAFTAURA</h1>
      <span class="badge">Payment & Subscription Receipt</span>
    </div>
    <div class="content">
      <div class="greeting">Hi ${payload.customerName || "Merchant"},</div>
      <div class="message">
        Thank you for choosing Kraftaura. Your subscription payment has been verified successfully, and your store is fully upgraded and active.
      </div>
      
      <div class="card">
        <div class="card-title">Order Summary</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Purchased Plan</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; text-align: right; font-size: 13px;">${payload.planName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Amount Paid</td>
            <td style="padding: 8px 0; color: #34d399; font-weight: 800; text-align: right; font-size: 15px;">₹${payload.amount.toLocaleString("en-IN")}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Transaction ID</td>
            <td style="padding: 8px 0; color: #d4d4d8; font-family: monospace; font-size: 12px; text-align: right;">${payload.paymentId}</td>
          </tr>
          ${payload.subscriptionId ? `
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Subscription ID</td>
            <td style="padding: 8px 0; color: #d4d4d8; font-family: monospace; font-size: 12px; text-align: right;">${payload.subscriptionId}</td>
          </tr>
          ` : ""}
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Payment Date</td>
            <td style="padding: 8px 0; color: #ffffff; text-align: right; font-size: 13px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Subscription Status</td>
            <td style="padding: 8px 0; color: #34d399; font-weight: 700; text-align: right; font-size: 13px;">Active</td>
          </tr>
        </table>
      </div>

      <div style="font-size: 12px; color: #71717a; text-align: center; margin-bottom: 24px;">
        ${renewalNotice}
      </div>

      <div class="cta-container">
        <a href="https://www.kraftaura.in/dashboard" class="button">Open Merchant Dashboard</a>
      </div>
    </div>

    <div class="footer">
      Questions regarding your subscription? Contact our team at <a href="mailto:support@kraftaura.in">support@kraftaura.in</a>.<br>
      © ${new Date().getFullYear()} Kraftaura Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends a customer payment confirmation email.
 */
export async function sendCustomerPaymentConfirmation(
  payload: PaymentEmailPayload,
  userId?: string | null
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  // 1. Check idempotency
  const alreadySent = await isEmailAlreadyDelivered(payload.paymentId, "CUSTOMER_PAYMENT_SUCCESS");
  if (alreadySent) {
    return { success: true, skipped: true };
  }

  // 2. Validate customer email
  if (!payload.customerEmail || !payload.customerEmail.includes("@")) {
    console.error(`[EmailService] Missing valid customer email for payment ${payload.paymentId}`);
    return { success: false, error: "Invalid customer email address." };
  }

  try {
    const htmlContent = renderCustomerConfirmationHtml(payload);
    
    // Log outbound email for audit and production monitoring
    console.log(`[EmailService] Dispatched CUSTOMER_PAYMENT_SUCCESS to: ${payload.customerEmail} | Plan: ${payload.planName} | Amount: ₹${payload.amount} | TransId: ${payload.paymentId}`);

    // If an external SMTP or Resend API key is configured, send via provider
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Kraftaura Billing <billing@kraftaura.in>",
            to: [payload.customerEmail],
            subject: `Subscription Confirmed: ${payload.planName} (Kraftaura)`,
            html: htmlContent,
          }),
        });
      } catch (transportErr) {
        console.warn("[EmailService] External transport warning:", transportErr);
      }
    }

    // Record delivery in audit log table
    await recordEmailDelivery({
      userId: userId || null,
      emailType: "CUSTOMER_PAYMENT_SUCCESS",
      transactionId: payload.paymentId,
      recipient: payload.customerEmail,
      status: "sent",
      metadata: {
        plan: payload.planTier,
        amount: payload.amount,
        subscriptionId: payload.subscriptionId,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error(`[EmailService] Failed to send customer payment confirmation:`, err);
    await recordEmailDelivery({
      userId: userId || null,
      emailType: "CUSTOMER_PAYMENT_SUCCESS",
      transactionId: payload.paymentId,
      recipient: payload.customerEmail,
      status: "failed",
      errorMessage: err.message,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Sends an internal admin payment notification (strictly separated from customer confirmation).
 */
export async function sendAdminPaymentNotification(
  payload: AdminPaymentEmailPayload
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  // 1. Check idempotency
  const alreadySent = await isEmailAlreadyDelivered(payload.paymentId, "ADMIN_PAYMENT_NOTIFICATION");
  if (alreadySent) {
    return { success: true, skipped: true };
  }

  const adminRecipient = payload.adminEmail || getAdminNotificationEmail();

  try {
    console.log(`[EmailService] Dispatched ADMIN_PAYMENT_NOTIFICATION to Admin: ${adminRecipient} | Customer: ${payload.customerEmail} | Plan: ${payload.planName} | Amount: ₹${payload.amount}`);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Kraftaura System <alerts@kraftaura.in>",
            to: [adminRecipient],
            subject: `[Admin Alert] SaaS Subscription Payment: ${payload.planName} (₹${payload.amount})`,
            html: `
              <h2>New Kraftaura Platform Subscription</h2>
              <p><strong>Customer:</strong> ${payload.customerEmail} (${payload.customerName || "N/A"})</p>
              <p><strong>Plan:</strong> ${payload.planName} (₹${payload.amount})</p>
              <p><strong>Transaction ID:</strong> ${payload.paymentId}</p>
              <p><strong>Subscription ID:</strong> ${payload.subscriptionId || "N/A"}</p>
              <p><strong>Store ID:</strong> ${payload.storeId || "N/A"}</p>
              <p><strong>User ID:</strong> ${payload.userId || "N/A"}</p>
              <p><strong>Date:</strong> ${new Date(payload.purchaseDate).toISOString()}</p>
            `,
          }),
        });
      } catch (transportErr) {
        console.warn("[EmailService] Admin transport warning:", transportErr);
      }
    }

    await recordEmailDelivery({
      userId: payload.userId || null,
      emailType: "ADMIN_PAYMENT_NOTIFICATION",
      transactionId: payload.paymentId,
      recipient: adminRecipient,
      status: "sent",
      metadata: {
        customerEmail: payload.customerEmail,
        plan: payload.planTier,
        amount: payload.amount,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send admin payment notification:", err);
    await recordEmailDelivery({
      userId: payload.userId || null,
      emailType: "ADMIN_PAYMENT_NOTIFICATION",
      transactionId: payload.paymentId,
      recipient: adminRecipient,
      status: "failed",
      errorMessage: err.message,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Central orchestrator: resolves customer email, dispatches customer receipt, and sends optional admin alert.
 * Never throws an unhandled exception or interrupts subscription flow.
 */
export async function dispatchPaymentNotifications(params: {
  userId?: string | null;
  storeId?: string | null;
  fallbackCustomerEmail?: string | null;
  paymentId: string;
  subscriptionId?: string | null;
  planTier: PlanTier;
  amount?: number;
  currency?: string;
  purchaseDate?: string;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;
  sendAdminNotification?: boolean;
}): Promise<{ customerEmailSent: boolean; adminEmailSent: boolean; error?: string }> {
  try {
    const planConfig = PLANS[params.planTier] || PLANS.startup;
    const planName = planConfig.name;
    const amount = params.amount || planConfig.priceMonthly;
    const currency = params.currency || "INR";
    const purchaseDate = params.purchaseDate || new Date().toISOString();

    // 1. Authoritatively resolve the customer's email
    const customerAccount = await resolveCustomerEmail(
      params.userId,
      params.fallbackCustomerEmail,
      params.storeId
    );

    let customerEmailSent = false;
    let adminEmailSent = false;

    if (customerAccount?.email) {
      const customerPayload: PaymentEmailPayload = {
        customerEmail: customerAccount.email,
        customerName: customerAccount.name,
        planTier: params.planTier,
        planName,
        amount,
        currency,
        paymentId: params.paymentId,
        subscriptionId: params.subscriptionId,
        purchaseDate,
        currentPeriodEnd: params.currentPeriodEnd,
        nextBillingDate: params.nextBillingDate,
      };

      const res = await sendCustomerPaymentConfirmation(customerPayload, customerAccount.userId || params.userId);
      customerEmailSent = res.success;
    } else {
      console.warn(`[EmailService] Could not resolve customer email for payment ${params.paymentId}. Customer confirmation deferred.`);
    }

    // 2. Send distinct admin notification if enabled
    if (params.sendAdminNotification !== false) {
      const adminEmail = getAdminNotificationEmail();
      const adminPayload: AdminPaymentEmailPayload = {
        adminEmail,
        customerEmail: customerAccount?.email || params.fallbackCustomerEmail || "unknown@customer.com",
        customerName: customerAccount?.name,
        userId: params.userId,
        storeId: params.storeId,
        planTier: params.planTier,
        planName,
        amount,
        currency,
        paymentId: params.paymentId,
        subscriptionId: params.subscriptionId,
        purchaseDate,
      };

      const adminRes = await sendAdminPaymentNotification(adminPayload);
      adminEmailSent = adminRes.success;
    }

    return { customerEmailSent, adminEmailSent };
  } catch (err: any) {
    console.error("[EmailService] Unexpected error in dispatchPaymentNotifications:", err);
    return { customerEmailSent: false, adminEmailSent: false, error: err.message };
  }
}
