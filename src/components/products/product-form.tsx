"use client";

import React, { useState } from "react";
import { Product, ProductImage, ProductStatus, CategoryOption } from "@/types/product";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryDropdown } from "./category-dropdown";
import { ImageUploader } from "./image-uploader";
import { SEOCard } from "./seo-card";
import { Tag, Sparkles, DollarSign, Package, Layers, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ProductFormProps {
  initialValues?: Partial<Product>;
  categories: CategoryOption[];
  onAddCategory: (cat: CategoryOption) => void;
  onSubmit: (productData: Partial<Product>) => void;
  onValuesChange?: (updated: Partial<Product>, images: ProductImage[]) => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  initialValues = {},
  categories,
  onAddCategory,
  onSubmit,
  onValuesChange,
  isSubmitting = false,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues.name || "");
  const [shortDescription, setShortDescription] = useState(initialValues.shortDescription || "");
  const [longDescription, setLongDescription] = useState(initialValues.longDescription || "");
  const [categoryId, setCategoryId] = useState(initialValues.categoryId || categories[0]?.id || "");
  const [categoryName, setCategoryName] = useState(initialValues.categoryName || categories[0]?.name || "");
  const [price, setPrice] = useState(initialValues.price ? String(initialValues.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(initialValues.compareAtPrice ? String(initialValues.compareAtPrice) : "");
  const [sku, setSku] = useState(initialValues.sku || "");
  const [stock, setStock] = useState(initialValues.stock ? String(initialValues.stock) : "0");
  const [weight, setWeight] = useState(initialValues.weight ? String(initialValues.weight) : "");
  const [tags, setTags] = useState<string[]>(initialValues.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<ProductStatus>(initialValues.status || "published");
  const [featured, setFeatured] = useState(initialValues.featured || false);
  const [slug, setSlug] = useState(initialValues.slug || "");
  const [seoTitle, setSeoTitle] = useState(initialValues.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialValues.seoDescription || "");
  const [images, setImages] = useState<ProductImage[]>(initialValues.images || []);

  const notifyChange = (override?: Partial<Product>, newImages?: ProductImage[]) => {
    const updated: Partial<Product> = {
      name,
      shortDescription,
      longDescription,
      categoryId,
      categoryName,
      price: parseFloat(price) || 0,
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      sku,
      stock: parseInt(stock, 10) || 0,
      weight: weight ? parseFloat(weight) : undefined,
      tags,
      status,
      featured,
      slug,
      seoTitle,
      seoDescription,
      ...override,
    };
    onValuesChange?.(updated, newImages || images);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, "");
      if (!tags.includes(newTag)) {
        const nextTags = [...tags, newTag];
        setTags(nextTags);
        notifyChange({ tags: nextTags });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    notifyChange({ tags: nextTags });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product Name Required", "Please enter a name for your product.");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error("Price Required", "Please enter a valid product price.");
      return;
    }

    onSubmit({
      name,
      shortDescription,
      longDescription,
      categoryId,
      categoryName,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      sku: sku || `SKU-${Math.floor(Math.random() * 90000 + 10000)}`,
      stock: parseInt(stock, 10) || 0,
      weight: weight ? parseFloat(weight) : undefined,
      tags,
      status,
      featured,
      slug,
      seoTitle,
      seoDescription,
      images,
    });
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      {/* 1. General Product Details */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div>
          <h3 className="text-base font-bold font-heading text-white tracking-tight">
            Basic Information
          </h3>
          <p className="text-xs text-zinc-400 font-body mt-0.5">
            Product title, descriptions, and category placement.
          </p>
        </div>

        <Input
          label="Product Name"
          placeholder="e.g. Royal Amber Oud 100ml"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            notifyChange({ name: e.target.value });
          }}
          required
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
            Short Summary Description
          </label>
          <textarea
            rows={2}
            placeholder="A brief 1-2 sentence overview for catalog cards..."
            value={shortDescription}
            onChange={(e) => {
              setShortDescription(e.target.value);
              notifyChange({ shortDescription: e.target.value });
            }}
            className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-xs text-white font-body placeholder:text-zinc-600 outline-none hover:border-white/20 focus:border-maroon-700 transition-all resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
            Full Product Description
          </label>
          <textarea
            rows={5}
            placeholder="Detailed notes on ingredients, fragrance pyramid, craftsmanship..."
            value={longDescription}
            onChange={(e) => {
              setLongDescription(e.target.value);
              notifyChange({ longDescription: e.target.value });
            }}
            className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-xs text-white font-body placeholder:text-zinc-600 outline-none hover:border-white/20 focus:border-maroon-700 transition-all resize-none"
          />
        </div>

        <CategoryDropdown
          categories={categories}
          selectedCategoryId={categoryId}
          onSelectCategory={(cat) => {
            setCategoryId(cat.id);
            setCategoryName(cat.name);
            notifyChange({ categoryId: cat.id, categoryName: cat.name });
          }}
          onAddCategory={onAddCategory}
        />
      </Card>

      {/* 2. Media Gallery */}
      <Card className="p-6 bg-[#151515] border-white/10">
        <ImageUploader
          images={images}
          onChange={(newImages) => {
            setImages(newImages);
            notifyChange({}, newImages);
          }}
        />
      </Card>

      {/* 3. Pricing & Inventory */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div>
          <h3 className="text-base font-bold font-heading text-white tracking-tight">
            Pricing & Inventory
          </h3>
          <p className="text-xs text-zinc-400 font-body mt-0.5">
            Set retail price, sale price, stock count, and SKU identifier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Retail Price ($)"
            type="number"
            step="0.01"
            placeholder="140.00"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              notifyChange({ price: parseFloat(e.target.value) || 0 });
            }}
            leftIcon={<DollarSign className="w-4 h-4 text-zinc-500" />}
            required
          />

          <Input
            label="Original / Compare Price ($)"
            type="number"
            step="0.01"
            placeholder="165.00"
            value={compareAtPrice}
            onChange={(e) => {
              setCompareAtPrice(e.target.value);
              notifyChange({ compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined });
            }}
            leftIcon={<DollarSign className="w-4 h-4 text-zinc-500" />}
            helperText="Display crossed-out original price."
          />

          <Input
            label="Stock Quantity"
            type="number"
            placeholder="45"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              notifyChange({ stock: parseInt(e.target.value, 10) || 0 });
            }}
            leftIcon={<Package className="w-4 h-4 text-zinc-500" />}
          />

          <Input
            label="Stock Keeping Unit (SKU)"
            placeholder="OUD-ROYAL-100"
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              notifyChange({ sku: e.target.value });
            }}
          />
        </div>
      </Card>

      {/* 4. Tags & Attributes */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div>
          <h3 className="text-base font-bold font-heading text-white tracking-tight">
            Tags & Attributes
          </h3>
          <p className="text-xs text-zinc-400 font-body mt-0.5">
            Add keywords for search filters and catalog tagging.
          </p>
        </div>

        <div className="space-y-2">
          <Input
            label="Product Tags"
            placeholder="Type tag and press Enter or comma..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            leftIcon={<Tag className="w-4 h-4 text-zinc-500" />}
          />

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300 font-body"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            <span className="text-xs font-semibold text-white font-heading block">Featured Product</span>
            <span className="text-[11px] text-zinc-400 font-body">Highlight this item on store homepage collections.</span>
          </div>
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => {
              setFeatured(e.target.checked);
              notifyChange({ featured: e.target.checked });
            }}
            className="w-5 h-5 rounded bg-[#111111] border-white/20 text-maroon-600 focus:ring-maroon-500 cursor-pointer"
          />
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5 border-t border-white/10 pt-4">
          <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
            Product Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value as ProductStatus;
              setStatus(newStatus);
              notifyChange({ status: newStatus });
            }}
            className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3.5 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
          >
            <option value="published">Published (Visible in store)</option>
            <option value="draft">Draft (Private, not listed)</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </Card>

      {/* 5. SEO Card */}
      <SEOCard
        productName={name}
        slug={slug}
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSlugChange={(val) => {
          setSlug(val);
          notifyChange({ slug: val });
        }}
        onSeoTitleChange={(val) => {
          setSeoTitle(val);
          notifyChange({ seoTitle: val });
        }}
        onSeoDescriptionChange={(val) => {
          setSeoDescription(val);
          notifyChange({ seoDescription: val });
        }}
      />

      {/* Form Submission Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-semibold"
          isLoading={isSubmitting}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Save Product
        </Button>
      </div>
    </form>
  );
}
