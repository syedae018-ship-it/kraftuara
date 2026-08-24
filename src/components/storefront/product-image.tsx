"use client";

import React, { useState, useEffect } from "react";
import { resolveProductImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/image-resolver";

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export default function ProductImage({ src, alt, className, ...props }: ProductImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    
    const initialUrl = resolveProductImageUrl(src);
    setResolvedSrc(initialUrl);

    // Check if the URL is not a direct image (doesn't end with typical image extensions)
    // and is a webpage URL (like Instagram or generic website), then resolve OG image server-side
    const cleanUrl = src?.trim() || "";
    const isDirectImage = /\.(jpeg|jpg|gif|png|webp|svg)/i.test(cleanUrl) || cleanUrl.startsWith("data:");
    const isWebpage = cleanUrl.startsWith("http") && !isDirectImage;

    if (isWebpage) {
      let active = true;
      async function resolveOg() {
        try {
          const { resolveOgImageAction } = await import("@/lib/actions/store");
          const res = await resolveOgImageAction(cleanUrl);
          if (active && res.success && res.data?.imageUrl) {
            setResolvedSrc(res.data.imageUrl);
          }
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Failed to resolve OG image for URL:", cleanUrl, e);
          }
        }
      }
      resolveOg();
      return () => {
        active = false;
      };
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setResolvedSrc(FALLBACK_PRODUCT_IMAGE);
      if (process.env.NODE_ENV === "development") {
        console.warn(`Product image failed to load: ${src}`);
      }
    }
  };

  return (
    <img
      src={resolvedSrc || FALLBACK_PRODUCT_IMAGE}
      alt={alt}
      onError={handleError}
      className={className}
      {...props}
    />
  );
}
