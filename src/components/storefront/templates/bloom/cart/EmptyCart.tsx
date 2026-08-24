import { Button } from "../ui/button";
import { Shield, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { getStoreBasePath } from "@/lib/urls";

export default function EmptyCart({ storeSlug, isSubdomain = false }: { storeSlug: string; isSubdomain?: boolean }) {
  const basePath = getStoreBasePath(storeSlug, isSubdomain);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <ShoppingBag className="h-24 w-24 text-bloom-muted mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-bloom-foreground mb-4 font-heading">
            Your cart is empty
          </h1>
          <p className="text-bloom-muted text-lg">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
        </div>

        <div className="space-y-6">
          <Button
            asChild
            size="lg"
            className="bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90"
          >
            <Link href={basePath || "/"}>Continue Shopping</Link>
          </Button>

          <div className="flex items-center justify-center gap-6 text-sm text-bloom-muted">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-bloom-primary" />
              Free shipping over $50
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Secure checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
