/**
 * Kraftaura Typography Utilities & Font Stacks
 * Pure helper module with zero React / "use client" dependencies, safe for both server and client.
 */

export const SUPPORTED_FONTS = [
  "Helvetica Neue",
  "Poppins",
  "Inter",
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "DM Sans",
  "Manrope",
  "Plus Jakarta Sans",
  "Archivo",
  "Oswald",
  "Impact",
  "Playfair Display",
  "Space Grotesk",
  "Syne",
  "Outfit",
];

export const fontStacks: Record<string, string> = {
  "Helvetica Neue": '"Helvetica Neue", Helvetica, Arial, sans-serif',
  "Poppins": '"Poppins", sans-serif',
  "Inter": '"Inter", sans-serif',
  "Montserrat": '"Montserrat", sans-serif',
  "Roboto": '"Roboto", sans-serif',
  "Open Sans": '"Open Sans", sans-serif',
  "Lato": '"Lato", sans-serif',
  "DM Sans": '"DM Sans", sans-serif',
  "Manrope": '"Manrope", sans-serif',
  "Plus Jakarta Sans": '"Plus Jakarta Sans", sans-serif',
  "Archivo": '"Archivo", sans-serif',
  "Oswald": '"Oswald", sans-serif',
  "Impact": 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  "Playfair Display": '"Playfair Display", serif',
  "Space Grotesk": '"Space Grotesk", sans-serif',
  "Syne": '"Syne", sans-serif',
  "Outfit": '"Outfit", sans-serif',
};

export const getFontStack = (font: string): string => {
  return fontStacks[font] || `"${font}", sans-serif`;
};
