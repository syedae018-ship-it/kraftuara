"use client";

import React, { useState } from "react";
import { Upload, Link as LinkIcon, Star, Trash2, ArrowLeft, ArrowRight, Loader2, Plus } from "lucide-react";
import { ProductImage } from "@/types/product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { StorageService } from "@/lib/services/storage-service";

import { resolveProductImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/image-resolver";

export { resolveProductImageUrl as resolveOnlineImageUrl };

export interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  className?: string;
}

export function ImageUploader({ images, onChange, className }: ImageUploaderProps) {
  const [urlInput, setUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { activeStore } = useAuth();

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    const resolvedUrl = resolveProductImageUrl(urlInput);

    const newImg: ProductImage = {
      id: `img-${Date.now()}`,
      url: resolvedUrl,
      position: images.length,
      isCover: images.length === 0,
    };

    onChange([...images, newImg]);
    setUrlInput("");
    toast.success("Image Added", "Image URL added to gallery.");
  };

  const processAndUploadFiles = async (files: FileList) => {
    setIsUploading(true);
    try {
      const storeId = activeStore?.id || `unknown-${Date.now()}`;
      const uploadedImages: ProductImage[] = [];

      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];

        // Validate size — 5MB per file
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File Too Large", `"${file.name}" exceeds the 5MB per-file limit.`);
          continue;
        }

        // Validate type
        if (!file.type.startsWith("image/")) {
          toast.error("Invalid File Type", `"${file.name}" is not a supported image file.`);
          continue;
        }

        // IMPORTANT: Always go through StorageService — never use URL.createObjectURL().
        // blob: URLs only exist in the uploading browser tab and are immediately broken
        // when the server-side storefront (Next.js Server Component) tries to render them.
        // StorageService in mock mode converts to a persistent base64 data URL.
        // StorageService in Supabase mode uploads to a bucket and returns a public CDN URL.
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const path = `${storeId}/${Date.now()}-${idx}-${cleanFileName}`;
        const res = await StorageService.uploadFile("product-images", path, file);

        if (res.success) {
          uploadedImages.push({
            id: `img-${Date.now()}-${idx}`,
            url: res.data.url,
            altText: file.name,
            position: images.length + idx,
            isCover: images.length === 0 && idx === 0,
          });
        } else {
          toast.error("Upload Failed", `Failed to upload "${file.name}": ${res.error.message}`);
        }
      }

      if (uploadedImages.length > 0) {
        onChange([...images, ...uploadedImages]);
        toast.success("Images Added", `Successfully added ${uploadedImages.length} image(s).`);
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to upload files.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processAndUploadFiles(files);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFiles(e.dataTransfer.files);
    }
  };

  const setCover = (id: string) => {
    onChange(
      images.map((img) => ({
        ...img,
        isCover: img.id === id,
      }))
    );
    toast.info("Cover Updated", "Set new primary cover image.");
  };

  const deleteImage = (id: string) => {
    const filtered = images.filter((img) => img.id !== id);
    if (filtered.length > 0 && !filtered.some((i) => i.isCover)) {
      filtered[0].isCover = true;
    }
    onChange(filtered);
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const newIdx = direction === "left" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    onChange(updated.map((img, i) => ({ ...img, position: i })));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
          Product Media Gallery ({images.length})
        </label>
        <span className="text-[11px] text-zinc-500 font-body">PNG, JPG, WebP or Image URL · 5MB per file</span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          if (isUploading) return;
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 flex flex-col items-center justify-center gap-2",
          dragActive
            ? "border-maroon-500 bg-maroon-950/20"
            : "border-white/10 bg-[#111111] hover:border-white/20",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-6 h-6 animate-spin text-maroon-400" />
            <p className="text-xs font-semibold font-heading text-white">Processing image for storage...</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
              <Upload className="w-5 h-5 text-maroon-400" />
            </div>
            <div>
              <p className="text-xs font-semibold font-heading text-white">
                Drag &amp; drop product images here, or{" "}
                <label className="text-maroon-400 hover:underline cursor-pointer">
                  browse files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </p>
              <p className="text-[11px] text-zinc-500 font-body mt-0.5">High resolution square images recommended</p>
            </div>
          </>
        )}
      </div>

      {/* Add via Image URL Input */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Paste direct Image URL (e.g. https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            leftIcon={<LinkIcon className="w-4 h-4 text-zinc-500" />}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleAddUrl} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Add URL
        </Button>
      </div>

      {/* Image Gallery Grid & Sorter */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={cn(
                "relative group aspect-square rounded-xl bg-[#111111] border overflow-hidden transition-all flex items-center justify-center",
                img.isCover ? "border-maroon-600 shadow-glow" : "border-white/10 hover:border-white/20"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText || "Product image"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                }}
              />

              {/* Cover Badge */}
              {img.isCover && (
                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-maroon-900/90 text-white font-heading text-[10px] font-bold border border-maroon-600/50 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-amber-300" /> Cover
                </span>
              )}

              {/* Hover Controls Overlay */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1">
                  {!img.isCover && (
                    <button
                      type="button"
                      onClick={() => setCover(img.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-maroon-800 text-white transition-colors"
                      title="Set as Cover"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteImage(img.id)}
                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-800 text-red-300 transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => moveImage(idx, "left")}
                    disabled={idx === 0}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, "right")}
                    disabled={idx === images.length - 1}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
