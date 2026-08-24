"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackStorefrontEventAction } from "@/lib/actions/analytics";

interface StorefrontTrackerProps {
  storeId: string;
}

/**
 * Global helper to track events on the client side.
 * Automatically injects visitor/session tokens, UTM variables, referrers, and device types.
 */
export async function trackClientEvent(storeId: string, eventType: string, productId?: string) {
  if (typeof window === "undefined") return;

  let visitorId = localStorage.getItem("symar_visitor_id") || "";
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("symar_visitor_id", visitorId);
  }

  let sessionId = sessionStorage.getItem("symar_session_id") || "";
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("symar_session_id", sessionId);
  }

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return "mobile";
    return "desktop";
  };

  const utmSource = sessionStorage.getItem("symar_utm_source") || undefined;
  const utmMedium = sessionStorage.getItem("symar_utm_medium") || undefined;
  const utmCampaign = sessionStorage.getItem("symar_utm_campaign") || undefined;
  const utmTerm = sessionStorage.getItem("symar_utm_term") || undefined;
  const utmContent = sessionStorage.getItem("symar_utm_content") || undefined;
  const referrer = sessionStorage.getItem("symar_referrer") || undefined;
  const deviceType = getDeviceType();
  const pagePath = window.location.pathname;

  const res = await trackStorefrontEventAction({
    storeId,
    eventType,
    sessionId,
    visitorId,
    productId,
    pagePath,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    deviceType,
  });

}

function TrackerCore({ storeId }: StorefrontTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<{ key: string; timestamp: number } | null>(null);

  useEffect(() => {
    // Initialize visitor and session identifiers
    let visitorId = localStorage.getItem("symar_visitor_id") || "";
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("symar_visitor_id", visitorId);
    }

    let sessionId = sessionStorage.getItem("symar_session_id") || "";
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("symar_session_id", sessionId);
    }

    // Capture and persist UTM variables in sessionStorage
    const utms = ["source", "medium", "campaign", "term", "content"];
    utms.forEach((key) => {
      const val = searchParams.get(`utm_${key}`);
      if (val) {
        sessionStorage.setItem(`symar_utm_${key}`, val);
      }
    });

    // Capture and persist Referrer
    if (typeof document !== "undefined" && !sessionStorage.getItem("symar_referrer")) {
      const referrer = document.referrer;
      if (referrer && !referrer.includes(window.location.host)) {
        sessionStorage.setItem("symar_referrer", referrer);
      }
    }

    // Skip tracking non-public dashboard, auth, or admin pages
    const isPublicStorefront = 
      !pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/signup") &&
      !pathname.startsWith("/choose-template") &&
      !pathname.startsWith("/create-store");

    if (!isPublicStorefront) return;

    // Duplicate Page View Control:
    // Deduplicate by path + query parameters within a 10s sliding window
    const now = Date.now();
    const currentKey = pathname + "?" + searchParams.toString();

    if (
      lastTrackedRef.current &&
      lastTrackedRef.current.key === currentKey &&
      now - lastTrackedRef.current.timestamp < 10000
    ) {
      return;
    }

    lastTrackedRef.current = { key: currentKey, timestamp: now };

    // Detect device type
    const getDeviceType = () => {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
      if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return "mobile";
      return "desktop";
    };

    // Gather parameters
    const utmSource = sessionStorage.getItem("symar_utm_source") || undefined;
    const utmMedium = sessionStorage.getItem("symar_utm_medium") || undefined;
    const utmCampaign = sessionStorage.getItem("symar_utm_campaign") || undefined;
    const utmTerm = sessionStorage.getItem("symar_utm_term") || undefined;
    const utmContent = sessionStorage.getItem("symar_utm_content") || undefined;
    const referrer = sessionStorage.getItem("symar_referrer") || undefined;
    const deviceType = getDeviceType();

    // If it's a product details page, we skip global page_view tracking here,
    // because the product detail component will handle page_view + product_view tracking.
    const isProductPage = pathname.includes("/product/");
    const eventType = "page_view";

    async function recordPage() {
      if (isProductPage) return;

      const res = await trackStorefrontEventAction({
        storeId,
        eventType,
        sessionId,
        visitorId,
        pagePath: pathname,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        deviceType,
      });

    }

    recordPage();
  }, [pathname, searchParams, storeId]);

  return null;
}

export function StorefrontTracker({ storeId }: StorefrontTrackerProps) {
  return (
    <Suspense fallback={null}>
      <TrackerCore storeId={storeId} />
    </Suspense>
  );
}
