import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3 bg-[#151515] border-white/10">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <SkeletonText lines={2} />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ProductTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden p-4 space-y-3">
      <div className="flex justify-between border-b border-white/10 pb-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
          <div className="flex items-center gap-3 w-1/3">
            <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function ProductFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <SkeletonText lines={3} />
      </Card>
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
  );
}
