import { Product } from "@/types/product";
import ProductCard from "./ProductCard";

export default function ProductList({
  products,
  storeSlug,
  storeId,
  isSubdomain = false,
  onQuickView,
}: {
  products: Product[];
  storeSlug: string;
  storeId?: string;
  isSubdomain?: boolean;
  onQuickView?: (product: Product) => void;
}) {
  return (
    <div id="products" className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            storeSlug={storeSlug}
            storeId={storeId}
            isSubdomain={isSubdomain}
            onQuickView={onQuickView}
          />
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-bloom-foreground mb-2">
            No products found
          </h3>
          <p className="text-bloom-muted mb-4">
            This catalog is currently empty.
          </p>
        </div>
      )}
    </div>
  );
}
