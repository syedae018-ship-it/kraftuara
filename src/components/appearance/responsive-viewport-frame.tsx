"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

export type DeviceType = "desktop" | "tablet" | "mobile";

export interface ResponsiveViewportFrameProps {
  device: DeviceType;
  children: React.ReactNode;
  className?: string;
}

export const DEVICE_VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

export function ResponsiveViewportFrame({
  device,
  children,
  className,
}: ResponsiveViewportFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);

  const targetWidth = DEVICE_VIEWPORTS[device].width;
  const targetHeight = DEVICE_VIEWPORTS[device].height;

  // Auto-calculate presentation-level scale to fit available container seamlessly
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;

    // Available space with comfortable edge margins
    const paddingX = device === "desktop" ? 32 : 40;
    const paddingY = device === "desktop" ? 32 : 40;
    const availableWidth = Math.max(100, clientWidth - paddingX);
    const availableHeight = Math.max(100, clientHeight - paddingY);

    let calculatedScale = 1;
    if (device === "desktop") {
      // Desktop adapts to fill width if smaller than 1440px
      calculatedScale = Math.min(1, availableWidth / targetWidth);
    } else if (device === "tablet") {
      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;
      calculatedScale = Math.min(1, scaleX, scaleY);
    } else {
      // Mobile fits both dimensions smoothly
      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;
      calculatedScale = Math.min(1, scaleX, scaleY);
    }

    const finalScale = Math.max(0.3, Math.min(1, calculatedScale));
    setScale(finalScale);
  }, [device, targetWidth, targetHeight]);

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

    const existingSynced = iframeHead.querySelectorAll("[data-synced-style]");
    existingSynced.forEach((el) => el.remove());

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

      * {
        -webkit-user-drag: none;
      }
    `;
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setupIframe = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      syncIframeStyles(iframeDoc);

      const body = iframeDoc.body;
      body.className = "antialiased selection:bg-maroon-800 selection:text-white";
      body.id = "storefront-preview-root";
      setMountNode(body);

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
      className="w-full h-full flex items-center justify-center overflow-auto p-3 sm:p-6 bg-[#050505] relative select-none"
    >
      {/* Outer Scaled Presentation Wrapper */}
      <div
        style={{
          width: targetWidth,
          height: device === "desktop" ? `calc(100% / ${scale})` : targetHeight,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s ease",
          maxHeight: device === "desktop" ? `calc(100% / ${scale})` : undefined,
        }}
        className={className}
      >
        <iframe
          ref={iframeRef}
          title={`Storefront ${device} Viewport Preview`}
          style={{
            width: `${targetWidth}px`,
            height: "100%",
            border: "none",
            display: "block",
            backgroundColor: "#080808",
          }}
          className="w-full h-full rounded-[inherit] overflow-y-auto"
        />
      </div>

      {/* Render storefront inside iframe via Portal */}
      {mountNode && ReactDOM.createPortal(children, mountNode)}
    </div>
  );
}
