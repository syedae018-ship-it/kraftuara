import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { getStoreBasePath } from "@/lib/urls";

export default function Recommendations({ storeSlug, isSubdomain = false }: { storeSlug: string; isSubdomain?: boolean }) {
  const basePath = getStoreBasePath(storeSlug, isSubdomain);

  return (
    <div className="mt-16">
      <Card className="border-bloom-border bg-bloom-card text-bloom-foreground">
        <CardHeader>
          <CardTitle className="font-heading text-lg">You might also like</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-bloom-muted mb-4">
              Discover more products that match your style
            </p>
            <Button variant="outline" asChild className="border-bloom-border bg-bloom-background text-bloom-foreground">
              <Link href={basePath || "/"}>Browse Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
