"use client";

import React, { useState, useEffect } from "react";
import { resolveProductImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/image-resolver";

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export default function ProductImage({
  src,
  alt,
  className,
  loading = "lazy",
  decoding = "async",
  ...props
}: ProductImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => resolveProductImageUrl(src) || FALLBACK_PRODUCT_IMAGE);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    const initialUrl = resolveProductImageUrl(src);
    setResolvedSrc(initialUrl || FALLBACK_PRODUCT_IMAGE);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setResolvedSrc(FALLBACK_PRODUCT_IMAGE);
    }
  };

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={handleError}
      loading={loading}
      decoding={decoding}
      className={className}
      {...props}
    />
  );
}
