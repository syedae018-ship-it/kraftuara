import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { getStoreBasePath } from "@/lib/urls";

export default function ProductNotFound({ storeSlug, isSubdomain = false }: { storeSlug: string; isSubdomain?: boolean }) {
  const basePath = getStoreBasePath(storeSlug, isSubdomain);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-bloom-foreground mb-2 font-heading">
          Product not found
        </h1>
        <p className="text-bloom-muted mb-6">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild className="bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90">
          <Link href={basePath || "/"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Shop
          </Link>
        </Button>
      </div>
    </div>
  );
}
