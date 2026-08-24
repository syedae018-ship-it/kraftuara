export type ProductStatus = "published" | "draft" | "out_of_stock" | "hidden";

export type ProductImage = {
  id: string;
  url: string;
  altText?: string;
  position: number;
  isCover: boolean;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  categoryId: string;
  categoryName: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  weight?: number;
  tags: string[];
  status: ProductStatus;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  images: ProductImage[];
  views: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductFilterState = {
  search: string;
  category: string;
  status: string;
  sortBy: "created_desc" | "price_asc" | "price_desc" | "name_asc" | "stock_asc";
  viewMode: "table" | "grid";
};

export const initialCategories: CategoryOption[] = [
  { id: "cat-1", name: "Eau de Parfum", slug: "eau-de-parfum", itemCount: 14 },
  { id: "cat-2", name: "Attar Oils", slug: "attar-oils", itemCount: 8 },
  { id: "cat-3", name: "Home Fragrance", slug: "home-fragrance", itemCount: 5 },
  { id: "cat-[#", name: "Gift Sets", slug: "gift-sets", itemCount: 3 },
];

export const initialProducts: Product[] = [
  {
    id: "prod-01",
    name: "Royal Amber Oud 100ml",
    slug: "royal-amber-oud-100ml",
    shortDescription: "Pure Cambodian oud infused with Turkish rose and golden amber.",
    longDescription: "Hand-blended by master perfumers, Royal Amber Oud is an opulent fragrance that pairs aged Cambodian agarwood with spicy cardamom, rare Turkish rose petals, and a warm amber base. Designed for evening wear and special occasions.",
    categoryId: "cat-1",
    categoryName: "Eau de Parfum",
    price: 140.00,
    compareAtPrice: 165.00,
    sku: "OUD-ROYAL-100",
    stock: 45,
    weight: 0.45,
    tags: ["Oud", "Bestseller", "Unisex", "Luxury"],
    status: "published",
    featured: true,
    seoTitle: "Royal Amber Oud 100ml | Aroma Perfumes",
    seoDescription: "Shop Royal Amber Oud 100ml. Luxurious Cambodian agarwood and amber perfume with free worldwide delivery.",
    images: [
      { id: "img-1", url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600", altText: "Royal Amber Oud Bottle", position: 0, isCover: true },
      { id: "img-2", url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600", altText: "Perfume Packaging", position: 1, isCover: false },
    ],
    views: 1420,
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-05T14:30:00Z",
  },
  {
    id: "prod-02",
    name: "Velvet Musk Extrait 50ml",
    slug: "velvet-musk-extrait-50ml",
    shortDescription: "Sensual white musk combined with French lavender and sandalwood.",
    longDescription: "Velvet Musk Extrait is a concentrated oil-infused fragrance that wraps the skin in soft cashmeran, white musk, and delicate iris. Subtle, intoxicating, and long-lasting.",
    categoryId: "cat-1",
    categoryName: "Eau de Parfum",
    price: 80.00,
    compareAtPrice: 95.00,
    sku: "PERF-VELVET-50",
    stock: 12,
    weight: 0.30,
    tags: ["Musk", "Lavender", "Daily Wear"],
    status: "published",
    featured: false,
    seoTitle: "Velvet Musk Extrait 50ml | Aroma Perfumes",
    seoDescription: "Discover Velvet Musk Extrait. Smooth white musk and French lavender perfume.",
    images: [
      { id: "img-3", url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600", altText: "Velvet Musk Bottle", position: 0, isCover: true },
    ],
    views: 890,
    createdAt: "2026-02-02T11:15:00Z",
    updatedAt: "2026-02-04T09:20:00Z",
  },
  {
    id: "prod-03",
    name: "Imperial Rose Attar Concentrated Oil 12ml",
    slug: "imperial-rose-attar-12ml",
    shortDescription: "100% alcohol-free concentrated Taif rose oil.",
    longDescription: "Distilled from thousands of fresh Taif rose blossoms, Imperial Rose Attar offers pure floral elegance without alcohol. Long-lasting scent projection in a crystal applicator bottle.",
    categoryId: "cat-2",
    categoryName: "Attar Oils",
    price: 65.00,
    sku: "ATTAR-IMP-12",
    stock: 4,
    weight: 0.15,
    tags: ["Attar", "Rose", "Alcohol-Free"],
    status: "out_of_stock",
    featured: true,
    seoTitle: "Imperial Rose Attar 12ml | Aroma Perfumes",
    seoDescription: "Pure alcohol-free Taif rose attar oil in crystal applicator bottle.",
    images: [
      { id: "img-4", url: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600", altText: "Rose Attar Applicator", position: 0, isCover: true },
    ],
    views: 640,
    createdAt: "2026-01-28T08:45:00Z",
    updatedAt: "2026-02-05T16:00:00Z",
  },
  {
    id: "prod-04",
    name: "Saffron Leather Extrait 50ml",
    slug: "saffron-leather-extrait-50ml",
    shortDescription: "Bold Tuscan leather accented with red saffron and dark cedar.",
    longDescription: "Saffron Leather Extrait is an assertive, smoky fragrance pairing Italian leather accord with golden saffron threads, rich tobacco leaf, and Atlas cedarwood.",
    categoryId: "cat-1",
    categoryName: "Eau de Parfum",
    price: 150.00,
    compareAtPrice: 180.00,
    sku: "EXT-SAF-50",
    stock: 28,
    weight: 0.35,
    tags: ["Leather", "Saffron", "Extrait"],
    status: "published",
    featured: false,
    seoTitle: "Saffron Leather Extrait 50ml | Aroma Perfumes",
    seoDescription: "Tuscan leather and saffron perfume extrait.",
    images: [
      { id: "img-5", url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600", altText: "Saffron Leather Bottle", position: 0, isCover: true },
    ],
    views: 1150,
    createdAt: "2026-01-15T14:20:00Z",
    updatedAt: "2026-02-03T18:10:00Z",
  },
  {
    id: "prod-05",
    name: "Midnight Bakhoor Incense Burner Set",
    slug: "midnight-bakhoor-incense-set",
    shortDescription: "Handmade ceramic burner with 50g luxury agarwood chips.",
    longDescription: "Elevate your living space with our handcrafted ceramic bakhoor incense burner set. Includes 50 grams of high-grade Cambodian agarwood chips scented with frankincense.",
    categoryId: "cat-3",
    categoryName: "Home Fragrance",
    price: 55.00,
    sku: "BAKHOOR-SET-01",
    stock: 19,
    weight: 0.85,
    tags: ["Incense", "Bakhoor", "Home"],
    status: "draft",
    featured: false,
    seoTitle: "Midnight Bakhoor Incense Burner Set | Aroma Perfumes",
    seoDescription: "Handcrafted ceramic incense burner set with Cambodian agarwood bakhoor.",
    images: [
      { id: "img-6", url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600", altText: "Bakhoor Burner", position: 0, isCover: true },
    ],
    views: 210,
    createdAt: "2026-02-04T16:00:00Z",
    updatedAt: "2026-02-04T16:00:00Z",
  },
  {
    id: "prod-06",
    name: "Royal Oud Discovery Sample Set",
    slug: "royal-oud-discovery-sample-set",
    shortDescription: "5 x 10ml travel atomizers of our top selling fragrances.",
    longDescription: "Experience our complete luxury collection. Features 10ml miniature spray bottles of Royal Amber Oud, Velvet Musk, Saffron Leather, Imperial Rose, and Golden Sandalwood.",
    categoryId: "cat-4",
    categoryName: "Gift Sets",
    price: 95.00,
    compareAtPrice: 120.00,
    sku: "GIFT-DISCOVERY-5",
    stock: 50,
    weight: 0.50,
    tags: ["Sample Set", "Gift", "Travel"],
    status: "hidden",
    featured: false,
    seoTitle: "Royal Oud Discovery Sample Set | Aroma Perfumes",
    seoDescription: "5 x 10ml travel spray sample set of luxury perfumes.",
    images: [
      { id: "img-7", url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600", altText: "Discovery Box", position: 0, isCover: true },
    ],
    views: 430,
    createdAt: "2026-01-20T12:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
];
