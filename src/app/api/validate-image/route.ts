import { NextRequest, NextResponse } from "next/server";
import { validateExternalImageUrl } from "@/lib/image-resolver";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { isValid: false, error: "Please provide a valid image URL in the request body." },
        { status: 400 }
      );
    }

    const result = await validateExternalImageUrl(url);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { isValid: false, error: err.message || "Failed to validate image URL." },
      { status: 500 }
    );
  }
}
