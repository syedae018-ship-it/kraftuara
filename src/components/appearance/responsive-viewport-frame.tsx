"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

export type DeviceType = "desktop" | "tablet" | "mobile";

export interface ResponsiveViewportFrameProps {
  device: DeviceType;
  children: React.ReactNode;
  zoom?: "auto" | number; // "auto" or scaling factor (0.5, 0.75, 1.0)
  className?: string;
  onDimensionsChange?: (width: number, height: number, scale: number) => void;
}

export const DEVICE_VIEWPORTS = {
  mobile: { width: 390, height: 844, label: "Mobile (390 × 844)" },
  tablet: { width: 768, height: 1024, label: "Tablet (768 × 1024)" },
  desktop: { width: 1440, height: 900, label: "Desktop (1440 × 900)" },
} as const;

export function ResponsiveViewportFrame({
  device,
  children,
  zoom = "auto",
  className,
  onDimensionsChange,
}: ResponsiveViewportFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const targetWidth = DEVICE_VIEWPORTS[device].width;
  const targetHeight = DEVICE_VIEWPORTS[device].height;

  // Calculate presentation-level scale to fit available container when needed
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setContainerSize({ width: clientWidth, height: clientHeight });

    if (typeof zoom === "number") {
      setScale(zoom);
      onDimensionsChange?.(targetWidth, targetHeight, zoom);
      return;
    }

    // Auto-fit calculation
    const paddingX = device === "desktop" ? 32 : 48;
    const paddingY = 48;
    const availableWidth = Math.max(100, clientWidth - paddingX);
    const availableHeight = Math.max(100, clientHeight - paddingY);

    let calculatedScale = 1;
    if (device === "desktop") {
      // Desktop fits horizontally
      calculatedScale = Math.min(1, availableWidth / targetWidth);
    } else if (device === "tablet") {
      // Tablet fits both horizontally and vertically
      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;
      calculatedScale = Math.min(1, scaleX, scaleY);
    } else {
      // Mobile fits both horizontally and vertically
      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;
      calculatedScale = Math.min(1, scaleX, scaleY);
    }

    // Never scale down past 0.35 or up past 1.0 in auto mode
    const finalScale = Math.max(0.35, Math.min(1, calculatedScale));
    setScale(finalScale);
    onDimensionsChange?.(targetWidth, targetHeight, finalScale);
  }, [device, zoom, targetWidth, targetHeight, onDimensionsChange]);

  // Resize observer on container
  useEffect(() => {
    updateScale();
    if (!containerRef.current) return;

    const ro = new ResizeObserver(() => {
      updateScale();
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [updateScale]);

  // Synchronize document head, stylesheets, and custom fonts into iframe
  const syncIframeStyles = useCallback((iframeDoc: Document) => {
    const iframeHead = iframeDoc.head;
    if (!iframeHead) return;

    // Clear previous synced style tags if needed, keeping basic head tags
    const existingSynced = iframeHead.querySelectorAll("[data-synced-style]");
    existingSynced.forEach((el) => el.remove());

    // 1. Base meta tags
    if (!iframeHead.querySelector("meta[charset]")) {
      const metaCharset = iframeDoc.createElement("meta");
      metaCharset.setAttribute("charset", "utf-8");
      iframeHead.appendChild(metaCharset);
    }

    if (!iframeHead.querySelector("meta[name='viewport']")) {
      const metaViewport = iframeDoc.createElement("meta");
      metaViewport.setAttribute("name", "viewport");
      metaViewport.setAttribute("content", "width=device-width, initial-scale=1");
      iframeHead.appendChild(metaViewport);
    }

    // 2. Clone all stylesheet links and styles from parent document
    const parentHead = document.head;
    const parentStyles = parentHead.querySelectorAll("link[rel='stylesheet'], style");

    parentStyles.forEach((node) => {
      try {
        const cloned = node.cloneNode(true) as HTMLElement;
        cloned.setAttribute("data-synced-style", "true");
        iframeHead.appendChild(cloned);
      } catch {
        // Ignore cross-origin stylesheet clone issues
      }
    });

    // 3. Inject baseline styling reset for iframe document
    let customReset = iframeHead.querySelector("#preview-base-reset") as HTMLStyleElement;
    if (!customReset) {
      customReset = iframeDoc.createElement("style");
      customReset.id = "preview-base-reset";
      iframeHead.appendChild(customReset);
    }

    customReset.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        min-height: 100% !important;
        background-color: #080808 !important;
        color: #ffffff !important;
        font-family: var(--font-body, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif) !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        overflow-x: hidden !important;
      }
      
      /* Scrollbar polish */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: #080808;
      }
      ::-webkit-scrollbar-thumb {
        background: #222222;
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #333333;
      }

      /* Disable page unload on accidental drag/drop */
      * {
        -webkit-user-drag: none;
      }
    `;
  }, []);

  // Setup iframe and mount node
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setupIframe = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      syncIframeStyles(iframeDoc);

      // Setup body mount node
      const body = iframeDoc.body;
      body.className = "antialiased selection:bg-maroon-800 selection:text-white";
      body.id = "storefront-preview-root";
      setMountNode(body);

      // Handle internal anchor links inside preview (e.g. #products)
      const handleAnchorClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement)?.closest("a");
        if (!target) return;
        const href = target.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const targetEl = iframeDoc.querySelector(href);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth" });
          }
        }
      };

      iframeDoc.addEventListener("click", handleAnchorClick);

      // Watch parent head for dynamic style updates (Fast Refresh / Next.js font loader)
      const observer = new MutationObserver(() => {
        syncIframeStyles(iframeDoc);
      });
      observer.observe(document.head, { childList: true, subtree: true });

      return () => {
        iframeDoc.removeEventListener("click", handleAnchorClick);
        observer.disconnect();
      };
    };

    if (iframe.contentDocument?.readyState === "complete") {
      setupIframe();
    } else {
      iframe.addEventListener("load", setupIframe, { once: true });
    }
  }, [syncIframeStyles, device]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-auto p-2 sm:p-4 bg-[#050505] relative"
    >
      {/* Outer Scaled Presentation Wrapper */}
      <div
        style={{
          width: targetWidth,
          height: device === "desktop" ? "100%" : targetHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s ease",
          maxHeight: device === "desktop" ? "100%" : undefined,
        }}
        className={className}
      >
        <iframe
          ref={iframeRef}
          title={`Storefront ${device} Viewport Preview`}
          style={{
            width: `${targetWidth}px`,
            height: device === "desktop" ? "100%" : `${targetHeight}px`,
            border: "none",
            display: "block",
            backgroundColor: "#080808",
          }}
          className="w-full h-full rounded-[inherit] overflow-y-auto"
        />
      </div>

      {/* Render children into iframe document body via Portal */}
      {mountNode && ReactDOM.createPortal(children, mountNode)}
    </div>
  );
}
