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
  "Playfair Display": '"Playfair Display", Georgia, serif',
  "Space Grotesk": '"Space Grotesk", sans-serif',
  "Syne": '"Syne", sans-serif',
  "Outfit": '"Outfit", sans-serif',
};

export const getFontStack = (font?: string): string => {
  if (!font) return '"Inter", sans-serif';
  return fontStacks[font] || `"${font}", sans-serif`;
};

export const SYSTEM_FONTS = ["Helvetica Neue", "Helvetica", "Arial", "Impact", "Georgia", "Times New Roman"];

/**
 * Builds a valid Google Fonts URL for dynamic loading of heading and body fonts.
 */
export function getGoogleFontsUrl(headingFont?: string, bodyFont?: string): string | null {
  const hFont = headingFont || "Plus Jakarta Sans";
  const bFont = bodyFont || "Inter";

  const fontsToLoad: string[] = [];

  const addFont = (fontName: string) => {
    if (!fontName || SYSTEM_FONTS.includes(fontName)) return;
    const formatted = fontName.trim().replace(/ /g, "+");
    if (!fontsToLoad.includes(formatted)) {
      fontsToLoad.push(formatted);
    }
  };

  addFont(hFont);
  addFont(bFont);

  if (fontsToLoad.length === 0) return null;

  const fontQueries = fontsToLoad
    .map((f) => `family=${f}:wght@300;400;500;600;700;800`)
    .join("&");

  return `https://fonts.googleapis.com/css2?${fontQueries}&display=swap`;
}
