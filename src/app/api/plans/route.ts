import { NextResponse } from "next/server";
import { getAllPlans } from "@/lib/services/plan-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await getAllPlans(false);
    return NextResponse.json({
      success: true,
      data: plans,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch public plans API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load subscription plans" },
      { status: 500 }
    );
  }
}
