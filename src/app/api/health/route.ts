import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Perform a minimal lookup to confirm connection health
    const { error } = await supabase.from("themes").select("id").limit(1);

    if (error) {
      console.error("Health check database failure:", error.message);
      return NextResponse.json(
        { status: "error", message: "Database connection failed" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Health check runtime failure:", err.message);
    return NextResponse.json(
      { status: "error", message: "System unhealthy" },
      { status: 500 }
    );
  }
}
