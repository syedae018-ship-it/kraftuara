import { Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Features({
  shipping,
}: {
  shipping?: {
    freeShippingEnabled: boolean;
    freeShippingThreshold: number;
  };
}) {
  if (!shipping?.freeShippingEnabled) {
    return null;
  }

  return (
    <div className="mb-12 p-5 rounded-2xl border border-bloom-border bg-bloom-secondary text-bloom-foreground flex items-center gap-4 max-w-md mx-auto sm:mx-0">
      <div className="p-3 bg-bloom-accent rounded-xl shrink-0">
        <Truck className="h-5 w-5 text-bloom-primary" />
      </div>
      <div className="text-left">
        <h2 className="font-semibold text-bloom-foreground mb-0.5 font-heading text-sm">
          Free Shipping Eligible
        </h2>
        <p className="text-xs text-bloom-muted">
          Free shipping on orders over {formatCurrency(shipping.freeShippingThreshold)}
        </p>
      </div>
    </div>
  );
}
