import { Button } from "../ui/button";
import { Product } from "@/types/product";
import Link from "next/link";
import ProductCard from "../home/ProductCard";
import { getStoreBasePath } from "@/lib/urls";

interface RelatedProductsProps {
  relatedProducts: Product[];
  storeSlug: string;
  storeId?: string;
  isSubdomain?: boolean;
}

export default function RelatedProducts({ relatedProducts, storeSlug, storeId, isSubdomain = false }: RelatedProductsProps) {
  const basePath = getStoreBasePath(storeSlug, isSubdomain);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-bloom-foreground font-heading">Related Products</h2>
        <Button variant="ghost" asChild className="text-bloom-primary hover:text-bloom-primary/80 border-0">
          <Link href={basePath || "/"}>
            View All
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.slice(0, 4).map((rp) => (
          <ProductCard
            key={rp.id}
            product={rp}
            storeSlug={storeSlug}
            storeId={storeId}
            isSubdomain={isSubdomain}
          />
        ))}
      </div>
    </div>
  );
}
