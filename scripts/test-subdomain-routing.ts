import { extractSubdomainFromHostname, isValidSubdomainSlug, RESERVED_SUBDOMAINS } from "../src/lib/subdomain-utils";
import { getStorefrontUrl, getStoreUrl, getStoreBasePath } from "../src/lib/urls";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

console.log("\n==========================================");
console.log("TEST SUITE 1: Subdomain Slug Validation & Reserved Subdomains");
console.log("==========================================");

assert(isValidSubdomainSlug("riyaban").valid === true, "Valid slug: riyaban");
assert(isValidSubdomainSlug("aroma-perfumes").valid === true, "Valid slug: aroma-perfumes");
assert(isValidSubdomainSlug("tech-haven-2026").valid === true, "Valid slug: tech-haven-2026");
assert(isValidSubdomainSlug("newstore").valid === true, "Valid slug: newstore");

assert(isValidSubdomainSlug("").valid === false, "Empty slug rejected");
assert(isValidSubdomainSlug("ab").valid === false, "Short slug (< 3 chars) rejected");
assert(isValidSubdomainSlug("-starts-with-hyphen").valid === false, "Leading hyphen rejected");
assert(isValidSubdomainSlug("ends-with-hyphen-").valid === false, "Trailing hyphen rejected");
assert(isValidSubdomainSlug("contains.dots").valid === false, "Dots in slug rejected");
assert(isValidSubdomainSlug("contains_underscore").valid === false, "Underscore rejected");
assert(isValidSubdomainSlug("UPPERCASE").valid === true, "Uppercase converted/allowed as valid slug");

const reservedTests = [
  "www", "app", "admin", "api", "dashboard", "support",
  "help", "mail", "smtp", "cdn", "assets", "static",
  "billing", "payments", "auth", "login", "signup",
  "status", "docs", "checkout", "cart", "account", "settings",
  "pricing", "terms", "privacy"
];

for (const r of reservedTests) {
  assert(RESERVED_SUBDOMAINS.has(r), `Reserved set contains "${r}"`);
  assert(isValidSubdomainSlug(r).valid === false, `isValidSubdomainSlug rejects reserved name "${r}"`);
}

console.log("\n==========================================");
console.log("TEST SUITE 2: Hostname Detection & Extraction");
console.log("==========================================");

const rootDomain = "kraftaura.in";

// Production merchant subdomains
assert(extractSubdomainFromHostname("riyaban.kraftaura.in", rootDomain) === "riyaban", "Extract 'riyaban' from riyaban.kraftaura.in");
assert(extractSubdomainFromHostname("aroma-perfumes.kraftaura.in", rootDomain) === "aroma-perfumes", "Extract 'aroma-perfumes' from aroma-perfumes.kraftaura.in");
assert(extractSubdomainFromHostname("store-123.kraftaura.in:443", rootDomain) === "store-123", "Extract with port: store-123.kraftaura.in:443");

// Platform root / reserved subdomains
assert(extractSubdomainFromHostname("kraftaura.in", rootDomain) === null, "Apex kraftaura.in returns null");
assert(extractSubdomainFromHostname("www.kraftaura.in", rootDomain) === null, "www.kraftaura.in returns null");
assert(extractSubdomainFromHostname("admin.kraftaura.in", rootDomain) === null, "admin.kraftaura.in returns null");
assert(extractSubdomainFromHostname("dashboard.kraftaura.in", rootDomain) === null, "dashboard.kraftaura.in returns null");
assert(extractSubdomainFromHostname("app.kraftaura.in", rootDomain) === null, "app.kraftaura.in returns null");
assert(extractSubdomainFromHostname("api.kraftaura.in", rootDomain) === null, "api.kraftaura.in returns null");
assert(extractSubdomainFromHostname("billing.kraftaura.in", rootDomain) === null, "billing.kraftaura.in returns null");
assert(extractSubdomainFromHostname("payments.kraftaura.in", rootDomain) === null, "payments.kraftaura.in returns null");
assert(extractSubdomainFromHostname("auth.kraftaura.in", rootDomain) === null, "auth.kraftaura.in returns null");
assert(extractSubdomainFromHostname("support.kraftaura.in", rootDomain) === null, "support.kraftaura.in returns null");
assert(extractSubdomainFromHostname("help.kraftaura.in", rootDomain) === null, "help.kraftaura.in returns null");

// Edge cases
assert(extractSubdomainFromHostname("preview.vercel.app", rootDomain) === null, "Vercel preview returns null");
assert(extractSubdomainFromHostname("a.b.kraftaura.in", rootDomain) === null, "Nested subdomain a.b returns null");
assert(extractSubdomainFromHostname("-invalid.kraftaura.in", rootDomain) === null, "Invalid slug -invalid returns null");

// Local development
assert(extractSubdomainFromHostname("riyaban.localhost", rootDomain) === "riyaban", "Localhost: riyaban.localhost");
assert(extractSubdomainFromHostname("riyaban.localhost:3000", rootDomain) === "riyaban", "Localhost with port: riyaban.localhost:3000");
assert(extractSubdomainFromHostname("localhost:3000", rootDomain) === null, "Localhost apex returns null");
assert(extractSubdomainFromHostname("127.0.0.1:3000", rootDomain) === null, "127.0.0.1 apex returns null");

console.log("\n==========================================");
console.log("TEST SUITE 3: Canonical URL & Base Path Resolution");
console.log("==========================================");

assert(getStorefrontUrl("riyaban") === "https://riyaban.kraftaura.in", "getStorefrontUrl('riyaban') -> https://riyaban.kraftaura.in");
assert(getStorefrontUrl("aroma-perfumes") === "https://aroma-perfumes.kraftaura.in", "getStorefrontUrl('aroma-perfumes') -> https://aroma-perfumes.kraftaura.in");
assert(getStorefrontUrl("newstore") === "https://newstore.kraftaura.in", "getStorefrontUrl('newstore') -> https://newstore.kraftaura.in");
assert(getStoreUrl("riyaban") === "https://riyaban.kraftaura.in", "getStoreUrl('riyaban') -> https://riyaban.kraftaura.in");

// Store Base Path (Subdomain vs Fallback route)
assert(getStoreBasePath("riyaban", true) === "", "Subdomain base path is empty root ('')");
assert(getStoreBasePath("riyaban", false) === "/store/riyaban", "Fallback base path is '/store/riyaban'");

console.log("\n==========================================");
console.log("TEST SUITE 4: Storefront Path URL Construction");
console.log("==========================================");

// Subdomain URLs (clean relative links)
const subBasePath = getStoreBasePath("riyaban", true);
const subHome = subBasePath || "/";
const subProduct = `${subBasePath}/product/velvet-oud`;
const subCart = `${subBasePath}/cart`;
const subContact = `${subBasePath}/contact`;
const subTrack = `${subBasePath}/track`;

assert(subHome === "/", "Subdomain Home Link: /");
assert(subProduct === "/product/velvet-oud", "Subdomain Product Link: /product/velvet-oud");
assert(subCart === "/cart", "Subdomain Cart Link: /cart");
assert(subContact === "/contact", "Subdomain Contact Link: /contact");
assert(subTrack === "/track", "Subdomain Track Link: /track");

// Fallback Route URLs
const fbBasePath = getStoreBasePath("riyaban", false);
const fbHome = fbBasePath || "/";
const fbProduct = `${fbBasePath}/product/velvet-oud`;
const fbCart = `${fbBasePath}/cart`;
const fbContact = `${fbBasePath}/contact`;
const fbTrack = `${fbBasePath}/track`;

assert(fbHome === "/store/riyaban", "Fallback Home Link: /store/riyaban");
assert(fbProduct === "/store/riyaban/product/velvet-oud", "Fallback Product Link: /store/riyaban/product/velvet-oud");
assert(fbCart === "/store/riyaban/cart", "Fallback Cart Link: /store/riyaban/cart");
assert(fbContact === "/store/riyaban/contact", "Fallback Contact Link: /store/riyaban/contact");
assert(fbTrack === "/store/riyaban/track", "Fallback Track Link: /store/riyaban/track");

console.log("\n==========================================");
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
