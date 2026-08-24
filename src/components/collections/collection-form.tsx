"use client";

import React, { useState } from "react";
import { Collection, CollectionStatus, CreateCollectionInput } from "@/types/collection";
import { ProductImage } from "@/types/product";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/products/image-uploader";
import { SEOCard } from "@/components/products/seo-card";
import { ProductPicker } from "./product-picker";
import { Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface CollectionFormProps {
  initialValues?: Partial<Collection>;
  onSubmit: (data: CreateCollectionInput) => void;
  isSubmitting?: boolean;
}

export function CollectionForm({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
}: CollectionFormProps) {
  const [name, setName] = useState(initialValues.name || "");
  const [slug, setSlug] = useState(initialValues.slug || "");
  const [description, setDescription] = useState(initialValues.description || "");
  const [displayOrder, setDisplayOrder] = useState(
    initialValues.displayOrder !== undefined ? String(initialValues.displayOrder) : "1"
  );
  const [status, setStatus] = useState<CollectionStatus>(initialValues.status || "published");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialValues.selectedProductIds || []
  );
  const [seoTitle, setSeoTitle] = useState(initialValues.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialValues.seoDescription || "");

  const [images, setImages] = useState<ProductImage[]>(
    initialValues.coverImage
      ? [{ id: "col-cover-1", url: initialValues.coverImage, position: 0, isCover: true }]
      : []
  );

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Collection Name Required", "Please enter a name for the collection.");
      return;
    }

    const coverImage = images.find((i) => i.isCover)?.url || images[0]?.url || "";

    onSubmit({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      description,
      coverImage,
      status,
      displayOrder: parseInt(displayOrder, 10) || 1,
      selectedProductIds,
      seoTitle,
      seoDescription,
    });
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      {/* 1. Basic Details */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div>
          <h3 className="text-base font-bold font-heading text-white tracking-tight">
            Collection Details
          </h3>
          <p className="text-xs text-zinc-400 font-body mt-0.5">
            Name, summary description, display order, and status.
          </p>
        </div>

        <Input
          label="Collection Name"
          placeholder="e.g. Best Sellers, Summer Collection"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="A brief overview describing what curated items belong in this collection..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-xs text-white font-body placeholder:text-zinc-600 outline-none hover:border-white/20 focus:border-maroon-700 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Order Position"
            type="number"
            placeholder="1"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CollectionStatus)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3.5 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
            >
              <option value="published">Published (Visible in store)</option>
              <option value="draft">Draft (Private, unlisted)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 2. Collection Product Picker */}
      <Card className="p-6 bg-[#151515] border-white/10">
        <ProductPicker
          selectedProductIds={selectedProductIds}
          onChange={setSelectedProductIds}
        />
      </Card>

      {/* 3. Cover Image Upload */}
      <Card className="p-6 bg-[#151515] border-white/10">
        <ImageUploader images={images} onChange={setImages} />
      </Card>

      {/* 4. SEO Card */}
      <SEOCard
        productName={name}
        slug={slug}
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSlugChange={setSlug}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-semibold"
          isLoading={isSubmitting}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Save Collection
        </Button>
      </div>
    </form>
  );
}
