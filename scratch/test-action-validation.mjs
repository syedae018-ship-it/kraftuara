import { validateTermsAcceptance, CURRENT_TERMS_VERSION } from "../src/lib/constants/legal.js";

function testLegalValidation() {
  console.log("--- Testing Legal Acceptance Validation Logic ---");

  // 1. Missing / unchecked terms
  const res1 = validateTermsAcceptance(false);
  console.assert(!res1.isValid, "Unchecked boolean should fail");
  console.assert(res1.error === "Please accept the Terms & Conditions to create your account.", "Expected error message");
  console.log("✓ Test 1 Passed: false fails with error:", res1.error);

  const res2 = validateTermsAcceptance(null);
  console.assert(!res2.isValid, "null should fail");
  console.log("✓ Test 2 Passed: null fails");

  const res3 = validateTermsAcceptance(undefined);
  console.assert(!res3.isValid, "undefined should fail");
  console.log("✓ Test 3 Passed: undefined fails");

  // 2. Checked terms
  const res4 = validateTermsAcceptance(true, CURRENT_TERMS_VERSION);
  console.assert(res4.isValid, "true with valid version should pass");
  console.log("✓ Test 4 Passed: true with terms_v1 passes");

  const res5 = validateTermsAcceptance("on", CURRENT_TERMS_VERSION);
  console.assert(res5.isValid, "FormData 'on' value should pass");
  console.log("✓ Test 5 Passed: FormData 'on' passes");

  // 3. Stale version
  const res6 = validateTermsAcceptance(true, "terms_v0_legacy");
  console.assert(!res6.isValid, "Mismatched version should fail");
  console.log("✓ Test 6 Passed: Stale version fails with error:", res6.error);

  console.log("--- All Legal Acceptance Validation Tests Passed Successfully ---");
}

testLegalValidation();
