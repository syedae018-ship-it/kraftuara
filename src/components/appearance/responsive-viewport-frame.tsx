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
  desktop: { width: "100%", height: "100%" },
} as const;

export function ResponsiveViewportFrame({
  device,
  children,
  className,
}: ResponsiveViewportFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

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
      className="w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-4 md:p-6 bg-[#050505] relative select-none"
    >
      <div
        className={className}
        style={{
          width: device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px",
          maxWidth: "100%",
          height: "100%",
          maxHeight: device === "desktop" ? "100%" : device === "tablet" ? "920px" : "844px",
          transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.3s ease",
        }}
      >
        <iframe
          ref={iframeRef}
          title={`Storefront ${device} Viewport Preview`}
          style={{
            width: "100%",
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
