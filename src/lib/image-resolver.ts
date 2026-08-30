/**
 * Universal Image URL Resolver & Security Validator for Kraftaura
 * 
 * Flow:
 * INPUT URL -> PRE-CLASSIFICATION -> SECURITY (SSRF CHECK) -> TRANSFORMATION -> VALIDATION -> SAFE RESOLUTION
 */

import { ImageSourceType, ImageValidationResult, ExternalImageResult } from "@/types/image";

export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20style%3D%22background%3A%2318181b%22%3E%3Crect%20width%3D%2218%22%20height%3D%2218%22%20x%3D%223%22%20y%3D%223%22%20rx%3D%222%22%20ry%3D%222%22%2F%3E%3Ccircle%20cx%3D%229%22%20cy%3D%229%22%20r%3D%222%22%2F%3E%3Cpath%20d%3D%22m21%2015-3.086-3.086a2%202%200%200%200-2.828%200L6%2021%22%2F%3E%3C%2Fsvg%3E";

export const FALLBACK_LOGO_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239f1239%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20style%3D%22background%3A%2318181b%22%3E%3Cpath%20d%3D%22m2%207%204.41-4.41A2%202%200%200%201%207.83%202h8.34a2%202%200%200%201%201.42.59L22%207%22%2F%3E%3Cpath%20d%3D%22M4%2012v8a2%202%200%200%200%202%202h12a2%202%200%200%200%202-2v-8%22%2F%3E%3Cpath%20d%3D%22M15%2022v-4a2%202%200%200%200-2-2h-2a2%202%200%200%200-2%202v4%22%2F%3E%3Cpath%20d%3D%22M2%207h20%22%2F%3E%3C%2Fsvg%3E";

export const FALLBACK_IMAGE = FALLBACK_PRODUCT_IMAGE;

/**
 * Checks if a hostname belongs to private, internal, or loopback network ranges (SSRF Guard).
 */
export function isPrivateOrRestrictedHost(hostname: string): boolean {
  if (!hostname || typeof hostname !== "string") return true;

  const normalized = hostname.trim().toLowerCase();

  // Localhost & loopback
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "ip6-localhost" ||
    normalized === "ip6-loopback"
  ) {
    return true;
  }

  // Cloud metadata services
  if (
    normalized === "169.254.169.254" ||
    normalized === "metadata.google.internal" ||
    normalized === "metadata" ||
    normalized.includes("169.254.")
  ) {
    return true;
  }

  // IPv4 Private Address Ranges (RFC 1918)
  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const oct1 = parseInt(ipv4Match[1], 10);
    const oct2 = parseInt(ipv4Match[2], 10);

    // 10.0.0.0/8
    if (oct1 === 10) return true;
    // 127.0.0.0/8 (loopback)
    if (oct1 === 127) return true;
    // 0.0.0.0/8
    if (oct1 === 0) return true;
    // 172.16.0.0/12
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true;
    // 192.168.0.0/16
    if (oct1 === 192 && oct2 === 168) return true;
    // 169.254.0.0/16 (link-local)
    if (oct1 === 169 && oct2 === 254) return true;
  }

  return false;
}

/**
 * Pre-checks and classifies URL to detect non-image webpage URLs (Google search, Instagram profile, etc.).
 */
export function preClassifyImageUrl(inputUrl: string): {
  isBlockedWebpage: boolean;
  guidance?: string;
  sourceType: ImageSourceType;
  resolvedUrl: string;
} {
  const trimmed = inputUrl.trim();

  if (trimmed.startsWith("data:image/")) {
    return { isBlockedWebpage: false, sourceType: "data_url", resolvedUrl: trimmed };
  }

  if (trimmed.startsWith("/")) {
    return { isBlockedWebpage: false, sourceType: "relative", resolvedUrl: trimmed };
  }

  // 1. Google Search / Images / Result URL check
  if (trimmed.includes("google.") && (trimmed.includes("/search") || trimmed.includes("/imgres") || trimmed.includes("/url") || trimmed.includes("imgurl="))) {
    // If it has imgurl or url parameter, extract the underlying target image URL
    const imgParam = trimmed.match(/[?&](?:imgurl|url)=([^&]+)/i);
    if (imgParam?.[1]) {
      const extracted = decodeURIComponent(imgParam[1]);
      return {
        isBlockedWebpage: false,
        sourceType: "google_images_extracted",
        resolvedUrl: extracted,
      };
    }
    return {
      isBlockedWebpage: true,
      guidance: "This is a Google search result page, not a direct image URL. Please copy the image address/source image URL instead.",
      sourceType: "external_direct",
      resolvedUrl: trimmed,
    };
  }

  // 2. Google Drive Links
  const gdFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  const gdIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*?(?:id|export)=([a-zA-Z0-9_-]+)/i);
  const gdLh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  const gdThumbnailMatch = trimmed.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/i);
  const gdId = gdFileMatch?.[1] || gdIdMatch?.[1] || gdLh3Match?.[1] || gdThumbnailMatch?.[1];

  if (gdId) {
    return {
      isBlockedWebpage: false,
      sourceType: "google_drive",
      resolvedUrl: `https://lh3.googleusercontent.com/d/${gdId}`,
    };
  }

  // 3. Instagram check
  if (trimmed.includes("instagram.com")) {
    const igPostMatch = trimmed.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i);
    if (igPostMatch?.[1]) {
      return {
        isBlockedWebpage: false,
        sourceType: "instagram_media",
        resolvedUrl: `https://www.instagram.com/p/${igPostMatch[1]}/media/?size=l`,
      };
    }
    // Profile or explore page
    return {
      isBlockedWebpage: true,
      guidance: "This Instagram link points to a profile or webpage, not a direct image. Please provide a direct public image URL.",
      sourceType: "external_direct",
      resolvedUrl: trimmed,
    };
  }

  // 4. YouTube check
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
    if (ytWatchMatch?.[1]) {
      return {
        isBlockedWebpage: false,
        sourceType: "youtube_thumbnail",
        resolvedUrl: `https://img.youtube.com/vi/${ytWatchMatch[1]}/hqdefault.jpg`,
      };
    }
    return {
      isBlockedWebpage: true,
      guidance: "This is a YouTube channel or home link. If you want a video thumbnail, provide the YouTube video link.",
      sourceType: "external_direct",
      resolvedUrl: trimmed,
    };
  }

  // 5. Facebook / Twitter / LinkedIn / Pinterest profile/page check
  if (
    (trimmed.includes("facebook.com") && !trimmed.includes(".fbcdn.net")) ||
    (trimmed.includes("twitter.com") && !trimmed.includes("pbs.twimg.com")) ||
    (trimmed.includes("x.com") && !trimmed.includes("pbs.twimg.com")) ||
    (trimmed.includes("linkedin.com") && !trimmed.includes("media.licdn.com")) ||
    (trimmed.includes("pinterest.com") && !trimmed.includes("i.pinimg.com"))
  ) {
    // Check if it has a file extension or is a pure profile link
    const hasImageExt = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(trimmed.split("?")[0]);
    if (!hasImageExt) {
      return {
        isBlockedWebpage: true,
        guidance: "This link points to a social media webpage, not a direct image. Please copy the direct image link instead.",
        sourceType: "external_direct",
        resolvedUrl: trimmed,
      };
    }
  }

  // 6. Unsplash Photo Page
  const unsplashMatch = trimmed.match(/unsplash\.com\/photos\/([a-zA-Z0-9_-]+)/i);
  if (unsplashMatch?.[1] && !trimmed.includes("images.unsplash.com")) {
    return {
      isBlockedWebpage: false,
      sourceType: "unsplash",
      resolvedUrl: `https://images.unsplash.com/photo-${unsplashMatch[1]}?w=1200&auto=format&fit=crop`,
    };
  }

  // 7. Imgur Page
  const imgurMatch = trimmed.match(/imgur\.com\/(?:gallery\/)?([a-zA-Z0-9]{5,8})$/i);
  if (imgurMatch?.[1] && !trimmed.includes("i.imgur.com")) {
    return {
      isBlockedWebpage: false,
      sourceType: "imgur",
      resolvedUrl: `https://i.imgur.com/${imgurMatch[1]}.jpg`,
    };
  }

  return {
    isBlockedWebpage: false,
    sourceType: "external_direct",
    resolvedUrl: trimmed,
  };
}

/**
 * Universal synchronous image resolver for storefront components.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") {
    return FALLBACK_IMAGE;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return FALLBACK_IMAGE;
  }

  const classification = preClassifyImageUrl(trimmed);
  return classification.resolvedUrl;
}

/**
 * Comprehensive Server/Client validator for external image URLs.
 * Validates protocol, SSRF security, content-type headers, size limits, and timeout.
 */
export async function validateExternalImageUrl(inputUrl: string): Promise<ImageValidationResult> {
  if (!inputUrl || typeof inputUrl !== "string") {
    return {
      isValid: false,
      resolvedUrl: "",
      sourceType: "external_direct",
      error: "Please provide a valid image URL.",
    };
  }

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      resolvedUrl: "",
      sourceType: "external_direct",
      error: "Image URL cannot be empty.",
    };
  }

  // Data URLs and local paths are automatically valid
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("/")) {
    return {
      isValid: true,
      resolvedUrl: trimmed,
      sourceType: trimmed.startsWith("data:image/") ? "data_url" : "relative",
    };
  }

  // Validate URL scheme
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      resolvedUrl: trimmed,
      sourceType: "external_direct",
      error: "Invalid URL format. Please provide a full URL starting with https://",
    };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      isValid: false,
      resolvedUrl: trimmed,
      sourceType: "external_direct",
      error: "Only HTTP and HTTPS image URLs are supported.",
    };
  }

  // SSRF Protection Guard
  if (isPrivateOrRestrictedHost(parsedUrl.hostname)) {
    return {
      isValid: false,
      resolvedUrl: trimmed,
      sourceType: "external_direct",
      error: "Security violation: Internal and local network URLs are restricted.",
    };
  }

  // Pre-classify and resolve supported transformations
  const classification = preClassifyImageUrl(trimmed);
  if (classification.isBlockedWebpage) {
    return {
      isValid: false,
      resolvedUrl: classification.resolvedUrl,
      sourceType: classification.sourceType,
      error: classification.guidance || "This link points to a webpage, not a direct image.",
      guidance: classification.guidance,
    };
  }

  const finalUrl = classification.resolvedUrl;

  // SSRF check on transformed URL destination
  try {
    const finalParsed = new URL(finalUrl);
    if (isPrivateOrRestrictedHost(finalParsed.hostname)) {
      return {
        isValid: false,
        resolvedUrl: finalUrl,
        sourceType: classification.sourceType,
        error: "Security violation: Internal and local network URLs are restricted.",
      };
    }
  } catch {
    // Malformed final URL
  }

  // Server-side network validation (HEAD / GET request with 3.5s timeout)
  if (typeof window === "undefined") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(finalUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "KraftauraStorefront/1.0 (ImageValidator)",
          Accept: "image/*,*/*;q=0.8",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Some CDNs block HEAD requests (403/405). Fallback to ranged GET (first 1KB)
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 3500);

        const getRes = await fetch(finalUrl, {
          method: "GET",
          headers: {
            Range: "bytes=0-1024",
            "User-Agent": "KraftauraStorefront/1.0 (ImageValidator)",
            Accept: "image/*,*/*;q=0.8",
          },
          signal: getController.signal,
        });

        clearTimeout(getTimeoutId);

        if (!getRes.ok) {
          return {
            isValid: false,
            resolvedUrl: finalUrl,
            sourceType: classification.sourceType,
            error: "This image isn't publicly accessible. Please check permissions or use another image URL.",
          };
        }

        const contentType = getRes.headers.get("content-type") || "";
        if (contentType.includes("text/html") || contentType.includes("application/json")) {
          return {
            isValid: false,
            resolvedUrl: finalUrl,
            sourceType: classification.sourceType,
            error: "This link points to a webpage or API, not an image.",
          };
        }

        return {
          isValid: true,
          resolvedUrl: finalUrl,
          sourceType: classification.sourceType,
          contentType: contentType,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const contentLength = response.headers.get("content-length");

      // Check max size: 10MB
      if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
        return {
          isValid: false,
          resolvedUrl: finalUrl,
          sourceType: classification.sourceType,
          error: "The image exceeds the 10MB maximum supported file size.",
        };
      }

      if (contentType.includes("text/html") || contentType.includes("application/json")) {
        return {
          isValid: false,
          resolvedUrl: finalUrl,
          sourceType: classification.sourceType,
          error: "This link points to a webpage or API, not an image file.",
        };
      }

      return {
        isValid: true,
        resolvedUrl: finalUrl,
        sourceType: classification.sourceType,
        contentType: contentType,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          isValid: false,
          resolvedUrl: finalUrl,
          sourceType: classification.sourceType,
          error: "Image validation timed out. The remote host took too long to respond.",
        };
      }
      // If server-side network check fails due to edge environment, allow if URL structure is valid
      return {
        isValid: true,
        resolvedUrl: finalUrl,
        sourceType: classification.sourceType,
      };
    }
  }

  // Browser Client validation
  return {
    isValid: true,
    resolvedUrl: finalUrl,
    sourceType: classification.sourceType,
  };
}

// Backwards-compatible alias for products
export const resolveProductImageUrl = resolveImageUrl;
