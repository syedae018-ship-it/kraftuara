"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ActionResponse } from "@/types";

export type ThemePreset = {
  id: string;
  name: string;
  slug: string;
  description: string;
  previewGradient: string;
};

export async function getThemesAction(): Promise<ActionResponse<ThemePreset[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: themes, error } = await (supabase.from("themes") as any)
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error || !themes || themes.length === 0) {
      // Fallback statically defined themes if DB table not yet populated locally
      return successResponse<ThemePreset[]>([
        {
          id: "t-1",
          name: "Luxury",
          slug: "luxury",
          description: "Deep obsidian with gold accents for high-end catalog stores.",
          previewGradient: "from-amber-900/40 via-yellow-950/20 to-[#0B0B0C]",
        },
        {
          id: "t-2",
          name: "Minimal",
          slug: "minimal",
          description: "Clean monochrome typography with ultra-fast layout.",
          previewGradient: "from-zinc-800/50 via-zinc-900/30 to-[#050505]",
        },
        {
          id: "t-3",
          name: "Fashion",
          slug: "fashion",
          description: "Vibrant high-contrast grid designed for apparel & footwear.",
          previewGradient: "from-rose-950/40 via-purple-950/20 to-[#0F0F10]",
        },
        {
          id: "t-4",
          name: "Dark Maroon",
          slug: "dark",
          description: "Industrial dark surface with signature deep maroon glow.",
          previewGradient: "from-maroon-900/50 via-maroon-950/30 to-[#080808]",
        },
        {
          id: "t-5",
          name: "Elegant",
          slug: "elegant",
          description: "Refined serif typography with subtle ambient lighting.",
          previewGradient: "from-amber-950/30 via-stone-900/30 to-[#0D0E10]",
        },
      ]);
    }

    const mappedThemes: ThemePreset[] = themes.map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description:
        t.slug === "luxury"
          ? "Deep obsidian with gold accents for high-end catalog stores."
          : t.slug === "minimal"
          ? "Clean monochrome typography with ultra-fast layout."
          : t.slug === "fashion"
          ? "Vibrant high-contrast grid designed for apparel & footwear."
          : t.slug === "dark"
          ? "Industrial dark surface with signature deep maroon glow."
          : "Refined serif typography with subtle ambient lighting.",
      previewGradient:
        t.slug === "luxury"
          ? "from-amber-900/40 via-yellow-950/20 to-[#0B0B0C]"
          : t.slug === "minimal"
          ? "from-zinc-800/50 via-zinc-900/30 to-[#050505]"
          : t.slug === "fashion"
          ? "from-rose-950/40 via-purple-950/20 to-[#0F0F10]"
          : t.slug === "dark"
          ? "from-maroon-900/50 via-maroon-950/30 to-[#080808]"
          : "from-amber-950/30 via-stone-900/30 to-[#0D0E10]",
    }));

    return successResponse(mappedThemes);
  } catch {
    return errorResponse("Failed to load themes.");
  }
}
