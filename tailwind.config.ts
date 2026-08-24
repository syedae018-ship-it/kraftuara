import type { Config } from "tailwindcss";
import fontFamily from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        bloom: {
          background: "var(--bloom-background, #FFFFFF)",
          foreground: "var(--bloom-foreground, #1F2937)",
          muted: "var(--bloom-muted, #6B7280)",
          card: "var(--bloom-card, #FFFFFF)",
          border: "var(--bloom-border, #E5E7EB)",
          primary: "var(--bloom-primary, #F97316)",
          "primary-foreground": "var(--bloom-primary-foreground, #FFFFFF)",
          accent: "var(--bloom-accent, #FFF7ED)",
          secondary: "var(--bloom-secondary, #F3F4F6)",
        },
        surface: {
          DEFAULT: "#111111",
          elevated: "#151515",
          hover: "#1A1A1A",
          active: "#222222",
        },
        card: {
          DEFAULT: "#151515",
          hover: "#191919",
          border: "rgba(255, 255, 255, 0.06)",
        },
        maroon: {
          50: "#fdf2f4",
          100: "#fbe5e8",
          200: "#f7cbcf",
          300: "#f2a3ab",
          400: "#e86e7c",
          500: "#d93d52",
          600: "#be263d",
          700: "#9b1b30", // Primary Deep Maroon Hover
          800: "#800020", // Deep Maroon Base Accent
          900: "#590016", // Subtle dark fill
          950: "#38000d", // Darkest background tint
        },
        accent: {
          DEFAULT: "#800020",
          hover: "#9b1b30",
          subtle: "rgba(128, 0, 32, 0.15)",
          border: "rgba(128, 0, 32, 0.35)",
          glow: "rgba(155, 27, 48, 0.25)",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          subtle: "rgba(255, 255, 255, 0.04)",
          strong: "rgba(255, 255, 255, 0.12)",
          focus: "rgba(155, 27, 48, 0.6)",
        },
        foreground: {
          DEFAULT: "#FFFFFF",
          secondary: "#A1A1AA",
          muted: "#71717A",
          subtle: "#52525B",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Plus Jakarta Sans", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        brand: ["var(--font-brand)", "Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(128, 0, 32, 0.3)",
        "glow-lg": "0 0 40px -5px rgba(128, 0, 32, 0.4)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
        dropdown: "0 10px 38px -10px rgba(0, 0, 0, 0.8), 0 10px 20px -15px rgba(0, 0, 0, 0.7)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
