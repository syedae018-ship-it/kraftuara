import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStoreBasePath } from "@/lib/urls";

export default function ProductBreadcrumb({ storeSlug, isSubdomain = false }: { storeSlug: string; isSubdomain?: boolean }) {
  const basePath = getStoreBasePath(storeSlug, isSubdomain);

  return (
    <nav className="mb-8">
      <Button
        variant="ghost"
        asChild
        className="text-bloom-muted hover:text-bloom-foreground border-0"
      >
        <Link href={basePath || "/"} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Return to Shop
        </Link>
      </Button>
    </nav>
  );
}
