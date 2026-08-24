"use client";

import React, { useState, useRef } from "react";
import { ZoomIn, X, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export function ImageZoom({
  src,
  alt,
  className,
  aspectRatio = "aspect-square",
}: ImageZoomProps) {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <>
      {/* Zoom Container */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setLightboxOpen(true)}
        className={cn(
          "relative overflow-hidden cursor-zoom-in group select-none bg-[#111111] border border-white/10 rounded-2xl",
          aspectRatio,
          className
        )}
      >
        {/* Main Base Image */}
        {src ? (
          <img
            src={src}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-transform duration-200",
              isHovered ? "scale-125 origin-center" : "scale-100"
            )}
            style={
              isHovered
                ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                : undefined
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Package className="w-12 h-12" />
          </div>
        )}

        {/* Zoom Cue Badge Overlay */}
        <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-white text-[11px] font-heading font-bold flex items-center gap-1.5 shadow-2xl">
          <ZoomIn className="w-3.5 h-3.5 text-maroon-400" /> Click to Expand
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-2xl"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#111111] relative"
          >
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </>
  );
}
