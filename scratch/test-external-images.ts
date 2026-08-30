import {
  resolveImageUrl,
  preClassifyImageUrl,
  validateExternalImageUrl,
  isPrivateOrRestrictedHost,
} from "../src/lib/image-resolver";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log("=== 1. DIRECT IMAGE URLS ===");
  const directJpg = "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539.jpg";
  assert(resolveImageUrl(directJpg) === directJpg, "Direct JPG URL preserved");

  const directWebp = "https://cdn.example.com/assets/perfume.webp";
  assert(resolveImageUrl(directWebp) === directWebp, "Direct WebP URL preserved");

  console.log("\n=== 2. GOOGLE DRIVE IMAGE RESOLUTION ===");
  const gdShareLink = "https://drive.google.com/file/d/1abcXYZ_98765-TEST/view?usp=sharing";
  const resolvedGd = resolveImageUrl(gdShareLink);
  assert(resolvedGd === "https://lh3.googleusercontent.com/d/1abcXYZ_98765-TEST", "Google Drive share link transformed to direct CDN");

  const gdOpenLink = "https://drive.google.com/open?id=1abcXYZ_98765-TEST";
  assert(resolveImageUrl(gdOpenLink) === "https://lh3.googleusercontent.com/d/1abcXYZ_98765-TEST", "Google Drive open?id transformed to direct CDN");

  console.log("\n=== 3. GOOGLE SEARCH / IMAGES HANDLING ===");
  const googleImgRes = "https://www.google.com/imgres?imgurl=https%3A%2F%2Fcdn.store.com%2Fbottle.png&tbnid=abc123xyz";
  assert(resolveImageUrl(googleImgRes) === "https://cdn.store.com/bottle.png", "Google Images imgurl extracted correctly");

  const googleSearchPage = "https://www.google.com/search?q=rose+perfume&tbm=isch";
  const preCheckSearch = preClassifyImageUrl(googleSearchPage);
  assert(preCheckSearch.isBlockedWebpage === true, "Google search result webpage correctly classified as non-image");
  assert(preCheckSearch.guidance?.includes("Google search result page") || false, "Provides friendly Google search guidance");

  console.log("\n=== 4. INSTAGRAM & YOUTUBE RESOLUTION ===");
  const igPost = "https://www.instagram.com/p/Cx98Y7Zabc/";
  assert(resolveImageUrl(igPost) === "https://www.instagram.com/p/Cx98Y7Zabc/media/?size=l", "Instagram post transformed to media endpoint");

  const igProfile = "https://www.instagram.com/kraftaura_perfumes/";
  const preCheckIg = preClassifyImageUrl(igProfile);
  assert(preCheckIg.isBlockedWebpage === true, "Instagram profile webpage correctly classified as non-image");

  const ytVideo = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  assert(resolveImageUrl(ytVideo) === "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", "YouTube watch video transformed to HQ thumbnail");

  const ytShorts = "https://youtube.com/shorts/dQw4w9WgXcQ";
  assert(resolveImageUrl(ytShorts) === "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", "YouTube shorts video transformed to HQ thumbnail");

  const ytChannel = "https://www.youtube.com/@Kraftaura";
  const preCheckYt = preClassifyImageUrl(ytChannel);
  assert(preCheckYt.isBlockedWebpage === true, "YouTube channel webpage correctly classified as non-image");

  console.log("\n=== 5. SSRF SECURITY GUARDS ===");
  assert(isPrivateOrRestrictedHost("localhost") === true, "localhost blocked");
  assert(isPrivateOrRestrictedHost("127.0.0.1") === true, "127.0.0.1 loopback blocked");
  assert(isPrivateOrRestrictedHost("0.0.0.0") === true, "0.0.0.0 blocked");
  assert(isPrivateOrRestrictedHost("169.254.169.254") === true, "AWS/GCP metadata IP blocked");
  assert(isPrivateOrRestrictedHost("192.168.1.100") === true, "192.168.x.x private network blocked");
  assert(isPrivateOrRestrictedHost("10.0.0.1") === true, "10.x.x.x private network blocked");
  assert(isPrivateOrRestrictedHost("172.20.0.5") === true, "172.16-31.x.x private network blocked");
  assert(isPrivateOrRestrictedHost("metadata.google.internal") === true, "metadata.google.internal blocked");
  assert(isPrivateOrRestrictedHost("images.unsplash.com") === false, "Public CDN domain allowed");

  console.log("\n=== 6. VALIDATION LOGIC ===");
  const valResultSSRF = await validateExternalImageUrl("http://127.0.0.1:8080/exploit.jpg");
  assert(valResultSSRF.isValid === false, "SSRF URL rejected by validateExternalImageUrl");
  assert(valResultSSRF.error?.includes("restricted") || false, "Returns security restriction error");

  const valResultGooglePage = await validateExternalImageUrl("https://www.google.com/search?q=oud");
  assert(valResultGooglePage.isValid === false, "Google search page rejected by validator");

  const driveClass = preClassifyImageUrl("https://drive.google.com/file/d/test1234/view");
  assert(driveClass.sourceType === "google_drive", "Google drive classified correctly");
  assert(driveClass.resolvedUrl === "https://lh3.googleusercontent.com/d/test1234", "Drive URL resolved to direct endpoint");

  const valRealImage = await validateExternalImageUrl("https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400");
  assert(valRealImage.isValid === true, "Live public image URL successfully validated");

  console.log("\n==========================================");
  console.log("🎉 ALL EXTERNAL IMAGE URL & SSRF TESTS PASSED!");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
