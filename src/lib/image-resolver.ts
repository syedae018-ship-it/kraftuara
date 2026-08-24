/**
 * Universal Image URL Resolver for Store Branding, Logos, and Products
 * 
 * Handles transformation of supported external sharing URLs:
 * - Google Images / Search (imgurl query parameter extractor)
 * - Google Drive (sharing links, uc, view, open, thumbnail) -> direct CDN image endpoint
 * - YouTube (watch, youtu.be, shorts, embed) -> high-quality video thumbnail
 * - Instagram (post / reel URLs) -> public CDN media thumbnail
 * - Unsplash (photo links) -> direct high-res image CDN
 * - Imgur (image/gallery links) -> direct i.imgur.com image
 * - Direct image links (JPG, PNG, WebP, GIF, SVG, Data URLs, CDN URLs) -> pass-through
 */

export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20style%3D%22background%3A%2318181b%22%3E%3Crect%20width%3D%2218%22%20height%3D%2218%22%20x%3D%223%22%20y%3D%223%22%20rx%3D%222%22%20ry%3D%222%22%2F%3E%3Ccircle%20cx%3D%229%22%20cy%3D%229%22%20r%3D%222%22%2F%3E%3Cpath%20d%3D%22m21%2015-3.086-3.086a2%202%200%200%200-2.828%200L6%2021%22%2F%3E%3C%2Fsvg%3E";

export const FALLBACK_LOGO_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239f1239%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20style%3D%22background%3A%2318181b%22%3E%3Cpath%20d%3D%22m2%207%204.41-4.41A2%202%200%200%201%207.83%202h8.34a2%202%200%200%201%201.42.59L22%207%22%2F%3E%3Cpath%20d%3D%22M4%2012v8a2%202%200%200%200%202%202h12a2%202%200%200%200%202-2v-8%22%2F%3E%3Cpath%20d%3D%22M15%2022v-4a2%202%200%200%200-2-2h-2a2%202%200%200%200-2%202v4%22%2F%3E%3Cpath%20d%3D%22M2%207h20%22%2F%3E%3C%2Fsvg%3E";

export const FALLBACK_IMAGE = FALLBACK_PRODUCT_IMAGE;

export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") {
    return FALLBACK_IMAGE;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return FALLBACK_IMAGE;
  }

  // Pass-through data URLs and relative paths
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    // 1. Google Images Search Result URL (extracting the raw image source)
    // Matches: google.com/imgres?imgurl=..., google.com/url?url=...
    if (trimmed.includes("google.") && (trimmed.includes("imgurl=") || trimmed.includes("url="))) {
      try {
        const parsedUrl = new URL(trimmed);
        const imgParam = parsedUrl.searchParams.get("imgurl") || parsedUrl.searchParams.get("url");
        if (imgParam) {
          return resolveImageUrl(decodeURIComponent(imgParam));
        }
      } catch {
        const regexMatch = trimmed.match(/[?&](?:imgurl|url)=([^&]+)/i);
        if (regexMatch?.[1]) {
          return resolveImageUrl(decodeURIComponent(regexMatch[1]));
        }
      }
    }

    // 2. Google Drive Links
    // Matches: drive.google.com/file/d/FILE_ID/..., drive.google.com/open?id=FILE_ID, drive.google.com/uc?id=FILE_ID, etc.
    const gdFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    const gdIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*?(?:id|export)=([a-zA-Z0-9_-]+)/i);
    const gdLh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
    const gdThumbnailMatch = trimmed.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/i);

    const gdId = gdFileMatch?.[1] || gdIdMatch?.[1] || gdLh3Match?.[1] || gdThumbnailMatch?.[1];
    if (gdId) {
      // High-performance direct Google UserContent CDN
      return `https://lh3.googleusercontent.com/d/${gdId}`;
    }

    // 3. YouTube Video Links -> HQ Thumbnail
    // Matches: youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID, youtube.com/embed/VIDEO_ID, youtube.com/shorts/VIDEO_ID
    const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
    if (ytWatchMatch?.[1]) {
      return `https://img.youtube.com/vi/${ytWatchMatch[1]}/hqdefault.jpg`;
    }

    // 4. Instagram Post & Reel Links -> Public Media Thumbnail
    const igMatch = trimmed.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i);
    if (igMatch?.[1]) {
      return `https://www.instagram.com/p/${igMatch[1]}/media/?size=l`;
    }

    // 5. Unsplash Photo Page Links
    const unsplashMatch = trimmed.match(/unsplash\.com\/photos\/([a-zA-Z0-9_-]+)/i);
    if (unsplashMatch?.[1] && !trimmed.includes("images.unsplash.com")) {
      return `https://images.unsplash.com/photo-${unsplashMatch[1]}?w=1200&auto=format&fit=crop`;
    }

    // 6. Imgur Links
    const imgurMatch = trimmed.match(/imgur\.com\/(?:gallery\/)?([a-zA-Z0-9]{5,8})$/i);
    if (imgurMatch?.[1] && !trimmed.includes("i.imgur.com")) {
      return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

// Backwards-compatible alias for products
export const resolveProductImageUrl = resolveImageUrl;
