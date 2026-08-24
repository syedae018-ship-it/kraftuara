"use client";

import React from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { Badge } from "@/components/ui/table";
import { TrendingUp } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <SectionTitle
        title="Platform Growth & Revenue Analytics"
        description="Comprehensive breakdown of store creation rates, MRR growth, top themes, and traffic."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <TrendingUp className="w-3 h-3 text-maroon-300" /> Platform Insights
          </Badge>
        }
      />

      <div className="pb-20 space-y-6">
        <AnalyticsChart />
      </div>
    </AdminLayout>
  );
}
