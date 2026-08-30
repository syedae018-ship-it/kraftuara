import {
  renderCustomerConfirmationHtml,
  sendCustomerPaymentConfirmation,
  sendAdminPaymentNotification,
  dispatchPaymentNotifications,
  getAdminNotificationEmail,
  isEmailAlreadyDelivered,
  PaymentEmailPayload,
} from "../src/lib/services/email-service";
import { PLANS } from "../src/lib/feature-gating";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log("=== 1. CUSTOMER RECEIPT TEMPLATE & VERIFIED DETAILS ===");
  
  const starterPayload: PaymentEmailPayload = {
    customerEmail: "merchant.starter@example.com",
    customerName: "Aarav Sharma",
    planTier: "startup",
    planName: PLANS.startup.name,
    amount: PLANS.startup.priceMonthly,
    currency: "INR",
    paymentId: "pay_test_startup_12345",
    subscriptionId: "sub_test_startup_99999",
    purchaseDate: "2026-08-30T10:00:00Z",
    nextBillingDate: "2026-09-30T10:00:00Z",
  };

  const starterHtml = renderCustomerConfirmationHtml(starterPayload);
  assert(starterHtml.includes("Startup Pack"), "Template contains 'Startup Pack'");
  assert(starterHtml.includes("₹99"), "Template contains '₹99'");
  assert(starterHtml.includes("pay_test_startup_12345"), "Template contains actual payment ID");
  assert(starterHtml.includes("sub_test_startup_99999"), "Template contains actual subscription ID");
  assert(starterHtml.includes("Aarav Sharma"), "Template contains customer name");

  const premiumPayload: PaymentEmailPayload = {
    customerEmail: "merchant.ai@example.com",
    customerName: "Priya Patel",
    planTier: "premium_ai",
    planName: PLANS.premium_ai.name,
    amount: PLANS.premium_ai.priceMonthly,
    currency: "INR",
    paymentId: "pay_test_premium_67890",
    subscriptionId: "sub_test_premium_88888",
    purchaseDate: "2026-08-30T10:00:00Z",
  };

  const premiumHtml = renderCustomerConfirmationHtml(premiumPayload);
  assert(premiumHtml.includes("Premium / AI Plan"), "Template contains 'Premium / AI Plan'");
  assert(premiumHtml.includes("₹1,499"), "Template contains '₹1,499'");
  assert(premiumHtml.includes("pay_test_premium_67890"), "Template contains actual payment ID");

  console.log("\n=== 2. RECIPIENT SEPARATION (CUSTOMER VS ADMIN) ===");
  const adminEmail = getAdminNotificationEmail();
  assert(typeof adminEmail === "string" && adminEmail.includes("@"), "Admin email is configured");
  assert(adminEmail !== starterPayload.customerEmail, "Admin email is strictly separated from customer email");

  console.log("\n=== 3. CUSTOMER DISPATCH & IDEMPOTENCY DEDUPLICATION ===");
  const uniquePayId = `pay_idempotent_test_${Date.now()}`;
  
  const testPayload: PaymentEmailPayload = {
    customerEmail: "unique.customer@example.com",
    customerName: "Rahul Verma",
    planTier: "growth",
    planName: PLANS.growth.name,
    amount: 299,
    currency: "INR",
    paymentId: uniquePayId,
    subscriptionId: "sub_growth_abc123",
    purchaseDate: new Date().toISOString(),
  };

  // First dispatch: should be sent
  const firstSend = await sendCustomerPaymentConfirmation(testPayload, null);
  assert(firstSend.success === true, "First payment confirmation dispatched successfully");
  assert(firstSend.skipped !== true, "First send was NOT skipped");

  // Verify delivery check
  const alreadyDelivered = await isEmailAlreadyDelivered(uniquePayId, "CUSTOMER_PAYMENT_SUCCESS");
  assert(alreadyDelivered === true, "Idempotency engine recorded delivery");

  // Second dispatch with same payment ID: should be skipped (deduplicated)
  const secondSend = await sendCustomerPaymentConfirmation(testPayload, null);
  assert(secondSend.success === true, "Second send handled gracefully");
  assert(secondSend.skipped === true, "Second send was correctly SKIPPED (duplicate prevention)");

  console.log("\n=== 4. DUAL NOTIFICATION ORCHESTRATOR ===");
  const orchPayId = `pay_orch_test_${Date.now()}`;
  const dispatchRes = await dispatchPaymentNotifications({
    fallbackCustomerEmail: "customer.orch@example.com",
    paymentId: orchPayId,
    subscriptionId: "sub_orch_xyz789",
    planTier: "pro",
    amount: 499,
    sendAdminNotification: true,
  });

  assert(dispatchRes.customerEmailSent === true, "Orchestrator dispatched customer confirmation");
  assert(dispatchRes.adminEmailSent === true, "Orchestrator dispatched admin notification");

  console.log("\n==========================================");
  console.log("🎉 ALL PAYMENT / SUBSCRIPTION EMAIL TESTS PASSED!");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
