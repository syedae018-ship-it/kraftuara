/**
 * Typography Tokens & Utility Mapping
 * Headings: Plus Jakarta Sans
 * Body: Inter
 */

export const typography = {
  h1: "font-heading text-3xl md:text-4xl font-bold tracking-tight text-white",
  h2: "font-heading text-2xl md:text-3xl font-semibold tracking-tight text-white",
  h3: "font-heading text-xl md:text-2xl font-semibold tracking-tight text-white",
  h4: "font-heading text-lg font-medium text-white",
  subtitle: "font-body text-base text-zinc-400 font-normal leading-relaxed",
  body: "font-body text-sm text-zinc-300 font-normal leading-normal",
  bodySmall: "font-body text-xs text-zinc-400 font-normal",
  caption: "font-body text-[11px] text-zinc-500 uppercase tracking-wider font-semibold",
} as const;
