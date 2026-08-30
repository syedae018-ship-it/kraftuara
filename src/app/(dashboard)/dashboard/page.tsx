"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { AnalyticsCard, TrafficSourcesCard } from "@/components/dashboard/chart-card";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { productRepository } from "@/lib/repositories/product-repository";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { creativeRepository } from "@/lib/repositories/creative-repository";
import { orderRepository } from "@/lib/repositories/order-repository";
import { getStoreUrl } from "@/lib/urls";
import { Product } from "@/types/product";
import { createClient } from "@/lib/supabase/client";
import { getStoreAnalyticsAction } from "@/lib/actions/analytics";
import { publishStoreChangesAction } from "@/lib/actions/store";
import { getPlanDisplayName, getProductLimit, normalizePlanTier } from "@/lib/feature-gating";
import {
  Package,
  Users,
  Sparkles,
  Plus,
  Grid,
  Palette,
  ExternalLink,
  Loader2,
  Copy,
  Globe,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { PublishStatusBadge } from "@/components/dashboard/publish-status-badge";

export default function DashboardOverview() {
  const router = useRouter();
  const { activeStore, user, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [creativeOrdersCount, setCreativeOrdersCount] = useState(0);
  const [analytics, setAnalytics] = useState({ views: 0, orders: 0, revenue: 0 });
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const currentPlanTier = normalizePlanTier(activeStore?.plan || user?.plan);
  const currentPlanDisplayName = getPlanDisplayName(currentPlanTier);
  const currentProductLimit = getProductLimit(currentPlanTier);

  const handlePublishChanges = async () => {
    if (!activeStore?.id) return;
    setIsPublishing(true);
    try {
      const res = await publishStoreChangesAction(activeStore.id);
      if (res.success) {
        toast.success("Changes Published!", "All draft store changes are now live.");
      } else {
        toast.error("Publish Failed", res.error || "Failed to publish store changes.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "An unexpected error occurred during publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    async function loadMetrics() {
      if (!activeStore?.id) return;
      setShowSkeletons(true);
      setFetchError(null);
      try {
        // 1. Fetch products
        const { products: pList } = await productRepository.getAll(activeStore.id);
        setProducts(pList);

        // 2. Fetch categories
        const cList = await categoryRepository.getAll(activeStore.id);
        setCategoriesCount(cList.length);

        // 3. Fetch creative orders
        const oList = await creativeRepository.getOrders();
        const activeCreative = oList.filter((o) => o.status !== "completed");
        setCreativeOrdersCount(activeCreative.length);

        // 4. Fetch real storefront orders & revenue from order repository
        const ordersList = await orderRepository.getAll(activeStore.id);
        const ordersCount = ordersList.length;
        const totalRevenue = ordersList.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

        // 5. Fetch storefront analytics aggregates
        let viewsCount = 0;
        let dataSummary = null;
        
        const res = await getStoreAnalyticsAction(activeStore.id, timeRange);
        if (res.success && res.analytics) {
          dataSummary = res.analytics;
        }

        if (dataSummary) {
          setAnalyticsData(dataSummary);
          viewsCount = dataSummary.views;
        }

        setAnalytics({ views: viewsCount, orders: ordersCount, revenue: totalRevenue });
      } catch (err: any) {
        console.error("Failed to load metrics:", err);
        setFetchError("Failed to load dashboard data. Please refresh the page.");
      } finally {
        setShowSkeletons(false);
      }
    }
    loadMetrics();
  }, [activeStore, timeRange]);

  if (isLoading || !activeStore) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Overview" }]}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Store</h2>
              <p className="text-zinc-400">Could not find your active store. Please try refreshing.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Overview" }]}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-bold text-red-500 mb-2">Data Load Failed</h2>
          <p className="text-zinc-400">{fetchError}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const liveStoreUrl = getStoreUrl(activeStore.slug);

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(liveStoreUrl);
    toast.success("Link Copied!", "Store URL copied to clipboard.");
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Overview" }]}>
      {/* Page Title & Consolidated Single Store Action Area */}
      <SectionTitle
        title={`${activeStore.name} Overview`}
        description={`Welcome back, ${user?.name || "Merchant"}. Here is your live catalog metrics summary.`}
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-maroon-300" /> {currentPlanDisplayName}
          </Badge>
        }
        action={
          <div className="flex items-center gap-2.5">
            <PublishStatusBadge storeId={activeStore.id} />
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs h-9"
              onClick={handlePublishChanges}
              isLoading={isPublishing}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            >
              Publish Changes
            </Button>
            <a href={liveStoreUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="primary"
                size="sm"
                className="shadow-glow text-xs h-9"
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Visit Store
              </Button>
            </a>
          </div>
        }
      />

      <div className="space-y-8 pb-16">
        {/* Active Store URL Highlight Card (Duplicate buttons removed) */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#161215] via-[#121014] to-[#0D0B0E] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 text-left min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white shrink-0 shadow-glow">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-maroon-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Live Merchant Store
                </span>
                <PublishStatusBadge storeId={activeStore.id} showRetry={false} />
              </div>
              <p
                className="text-xs sm:text-sm font-bold font-mono text-white tracking-tight mt-0.5 truncate block"
                title={liveStoreUrl}
              >
                {liveStoreUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={copyStoreUrl}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              className="border-white/10 text-xs h-9 justify-center flex-1 sm:flex-initial"
            >
              Copy Link
            </Button>
            <Link href="/dashboard/billing" className="flex-1 sm:flex-initial">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
                className="text-xs font-bold shadow-glow h-9 justify-center w-full"
              >
                Manage Plan
              </Button>
            </Link>
          </div>
        </div>


        {/* 1. Stat Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={products.length.toString()}
            delta={products.length > 0 ? { value: `${products.length}/${currentProductLimit} used`, isPositive: true } : undefined}
            subtitle={`${products.length} of ${currentProductLimit} products used`}
            icon={<Package className="w-4 h-4" />}
            isLoading={showSkeletons}
          />
          <PlanGate
            requiredPlan="growth"
            featureName="Store Views Analytics"
            description={`Upgrade to the ${getPlanDisplayName("growth")} to track storefront visits and unique visitors.`}
          >
            <StatCard
              title="Store Views"
              value={analytics.views > 0 ? analytics.views.toLocaleString() : "0"}
              delta={analytics.views > 0 ? { value: "Unique visitors", isPositive: true } : undefined}
              subtitle={analytics.views > 0 ? "Storefront visits" : "No visits tracked yet"}
              icon={<Users className="w-4 h-4" />}
              isLoading={showSkeletons}
            />
          </PlanGate>
          <StatCard
            title="Creative Orders"
            value={`${creativeOrdersCount} Active`}
            delta={creativeOrdersCount > 0 ? { value: "Banners requested", isPositive: true } : undefined}
            subtitle="Marketing design requests"
            icon={<Sparkles className="w-4 h-4" />}
            variant="maroon"
            isLoading={showSkeletons}
          />
          <PlanGate
            requiredPlan="pro"
            featureName="Direct Razorpay Revenue Analytics"
            description={`Upgrade to the ${getPlanDisplayName("pro")} to process direct payments and track revenue metrics.`}
          >
            <StatCard
              title="Gross Revenue"
              value={`₹${analytics.revenue.toFixed(2)}`}
              delta={analytics.revenue > 0 ? { value: "Razorpay sales", isPositive: true } : undefined}
              subtitle="Completed direct transactions"
              icon={<span className="text-xs font-bold font-mono">₹</span>}
              isLoading={showSkeletons}
            />
          </PlanGate>
        </div>

        {/* Onboarding Checklist Guide for Brand New Stores */}
        {!showSkeletons && products.length === 0 && (
          <Card className="p-6 bg-gradient-to-r from-[#1b1216] via-[#151115] to-[#111111] border-maroon-800/60 ring-1 ring-maroon-500/20 shadow-glow rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-maroon-800/30 border border-maroon-500/30 flex items-center justify-center text-maroon-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold font-heading text-white">Your store is ready! Let&apos;s get set up.</h3>
                <p className="text-[11px] text-zinc-400">Complete these quick steps to launch your digital catalog.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-maroon-400 font-bold uppercase tracking-wider">Step 1</span>
                  <h4 className="text-xs font-bold text-white">Add Your First Product</h4>
                  <p className="text-[11px] text-zinc-400">Upload photos, set pricing, stock count, and write descriptions.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push("/dashboard/products/new")}
                  className="w-full text-xs h-8 font-semibold shadow-glow"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Product
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-maroon-400 font-bold uppercase tracking-wider">Step 2</span>
                  <h4 className="text-xs font-bold text-white">Customize Your Storefront</h4>
                  <p className="text-[11px] text-zinc-400">Edit branding colors, themes, social profiles, and typography preferences.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/appearance")}
                  className="w-full text-xs h-8 font-semibold border-white/10"
                  leftIcon={<Palette className="w-3.5 h-3.5" />}
                >
                  Customize Appearance
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-maroon-400 font-bold uppercase tracking-wider">Step 3</span>
                  <h4 className="text-xs font-bold text-white">Share Your Link</h4>
                  <p className="text-[11px] text-zinc-400">Copy your public store link and start taking orders directly on WhatsApp.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyStoreUrl}
                  className="w-full text-xs h-8 font-semibold border-white/10"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy URL Link
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Localhost Subdomain Testing Warning */}
        {typeof window !== "undefined" && window.location.hostname.includes("localhost") && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-left text-xs text-amber-300 font-body space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-400" /> Local Host Subdomain Resolution Notice
            </p>
            <p className="text-[11px] text-zinc-400">
              To test wildcard subdomains on your local machine, configure hosts entries (e.g. <code>{activeStore.slug}.localhost</code>). Alternatively, test using the standard fallback path:{" "}
              <a 
                href={`/store/${activeStore.slug}`}
                className="text-amber-400 font-semibold hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                http://localhost:3000/store/{activeStore.slug}
              </a>
            </p>
          </div>
        )}

        {/* 2. Quick Actions Shortcuts Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold font-heading uppercase tracking-widest text-zinc-500">
            Quick Merchant Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
             <QuickActionCard
              title="Add Product"
              description="Upload new items to your catalog collection."
              icon={<Plus className="w-5 h-5" />}
              onClick={() => router.push("/dashboard/products/new")}
              isLoading={showSkeletons}
            />
            <QuickActionCard
              title="Create Category"
              description="Organize catalog items into structured groups."
              icon={<Grid className="w-5 h-5" />}
              onClick={() => router.push("/dashboard/categories")}
              isLoading={showSkeletons}
            />
            <QuickActionCard
              title="Customize Store"
              description="Update theme colors, fonts, and brand assets."
              icon={<Palette className="w-5 h-5" />}
              onClick={() => router.push("/dashboard/appearance")}
              isLoading={showSkeletons}
            />
            <QuickActionCard
              title="Order Creative"
              description="Request high-converting promotional banners."
              icon={<Sparkles className="w-5 h-5 text-amber-400" />}
              badge="Fast"
              onClick={() => router.push("/dashboard/creative")}
              isLoading={showSkeletons}
            />
            <QuickActionCard
              title="Preview Store"
              description="Inspect live catalog storefront as a customer."
              icon={<ExternalLink className="w-5 h-5" />}
              onClick={() => window.open(liveStoreUrl, "_blank")}
              isLoading={showSkeletons}
            />
          </div>
        </div>

        {/* 3. Analytics Chart Gated by Plan */}
        <PlanGate
          requiredPlan="growth"
          featureName="Store Traffic Analytics"
          description={`Upgrade to the ${getPlanDisplayName("growth")} or ${getPlanDisplayName("pro")} to unlock live visitor charts, conversion tracking, and traffic sources.`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnalyticsCard
                isLoading={showSkeletons}
                data={analyticsData?.dailyTrend}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
              />
            </div>
            <div>
              <TrafficSourcesCard
                isLoading={showSkeletons}
                sources={analyticsData?.trafficSources}
              />
            </div>
          </div>
        </PlanGate>

        {/* 4. Popular Products & Activity Timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Products Table Card */}
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-heading text-white tracking-tight">
                    Top Catalog Products
                  </h3>
                  <p className="text-xs text-zinc-400 font-body mt-0.5">
                    Highest performing items by sales volume and total revenue.
                  </p>
                </div>
                <Badge variant="outline">Top 4 Items</Badge>
              </div>

              {showSkeletons ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                          <Package className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                          No products in your catalog yet. Click &quot;Add Product&quot; to get started!
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.slice(0, 4).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-semibold text-white">{item.name}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-400">{item.sku || "N/A"}</TableCell>
                          <TableCell>0 units</TableCell>
                          <TableCell className="font-semibold font-mono text-emerald-400">₹0.00</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={item.stock > 0 ? "success" : "warning"}>
                              {item.stock > 0 ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>

          {/* Activity Timeline Card */}
          <div>
            <ActivityTimeline activities={[]} isLoading={showSkeletons} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
