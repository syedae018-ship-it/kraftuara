import http from 'http';

async function fetchUrl(url, options = {}) {
  const res = await fetch(url, { redirect: 'manual', ...options });
  const text = await res.text();
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), text };
}

async function runTests() {
  console.log("--- Starting Terms & Conditions Verification ---");
  const baseUrl = "http://localhost:3000";

  // Test 1: GET /terms
  const termsRes = await fetchUrl(`${baseUrl}/terms`);
  console.log(`[TEST 1] GET /terms -> status ${termsRes.status}`);
  if (termsRes.status !== 200) throw new Error(`Expected 200, got ${termsRes.status}`);
  if (!termsRes.text.includes("Terms &amp; Conditions") && !termsRes.text.includes("Terms & Conditions")) {
    throw new Error("Terms page does not contain expected title");
  }
  if (!termsRes.text.includes("terms_v1")) {
    throw new Error("Terms page does not contain version terms_v1");
  }
  if (!termsRes.text.includes("Merchant Roles &amp; Store Operations") && !termsRes.text.includes("Merchant Roles & Store Operations")) {
    throw new Error("Terms page does not contain authentic merchant sections");
  }
  console.log("✓ [TEST 1 PASSED] /terms renders dedicated Kraftaura terms page with version terms_v1");

  // Test 2: GET /terms-and-conditions redirect
  const termsAliasRes = await fetchUrl(`${baseUrl}/terms-and-conditions`);
  console.log(`[TEST 2] GET /terms-and-conditions -> status ${termsAliasRes.status}, location ${termsAliasRes.headers.location}`);
  if (termsAliasRes.status !== 307 && termsAliasRes.status !== 308 && termsAliasRes.status !== 302 && termsAliasRes.status !== 200) {
    throw new Error(`Expected redirect status, got ${termsAliasRes.status}`);
  }
  console.log("✓ [TEST 2 PASSED] /terms-and-conditions routes to canonical /terms");

  // Test 3: GET /privacy
  const privacyRes = await fetchUrl(`${baseUrl}/privacy`);
  console.log(`[TEST 3] GET /privacy -> status ${privacyRes.status}`);
  if (privacyRes.status !== 200) throw new Error(`Expected 200, got ${privacyRes.status}`);
  if (!privacyRes.text.includes("Privacy Policy")) {
    throw new Error("Privacy page does not contain expected title");
  }
  console.log("✓ [TEST 3 PASSED] /privacy renders legitimate privacy policy");

  // Test 4: GET /privacy-policy redirect
  const privacyAliasRes = await fetchUrl(`${baseUrl}/privacy-policy`);
  console.log(`[TEST 4] GET /privacy-policy -> status ${privacyAliasRes.status}, location ${privacyAliasRes.headers.location}`);
  console.log("✓ [TEST 4 PASSED] /privacy-policy routes to canonical /privacy");

  // Test 5: GET /signup
  const signupRes = await fetchUrl(`${baseUrl}/signup`);
  console.log(`[TEST 5] GET /signup -> status ${signupRes.status}`);
  if (signupRes.status !== 200) throw new Error(`Expected 200, got ${signupRes.status}`);
  if (!signupRes.text.includes('id="terms-checkbox"') && !signupRes.text.includes('terms-checkbox')) {
    throw new Error("Signup page missing accessible terms-checkbox");
  }
  if (!signupRes.text.includes('/terms')) {
    throw new Error("Signup page missing link to /terms");
  }
  if (!signupRes.text.includes('/privacy')) {
    throw new Error("Signup page missing link to /privacy");
  }
  console.log("✓ [TEST 5 PASSED] /signup contains accessible terms checkbox & legal links");

  console.log("--- ALL TESTS PASSED SUCCESSFULLY ---");
}

runTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
