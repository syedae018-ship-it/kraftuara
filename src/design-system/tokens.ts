/**
 * Design System Tokens
 * Strict color values, layout metrics, border radii, and Framer Motion transitions.
 */

export const colors = {
  background: "#080808",
  surface: {
    base: "#111111",
    elevated: "#151515",
    hover: "#1A1A1A",
    active: "#222222",
  },
  card: {
    base: "#151515",
    hover: "#191919",
    border: "rgba(255, 255, 255, 0.06)",
  },
  maroon: {
    base: "#800020",
    hover: "#9b1b30",
    dark: "#590016",
    subtle: "rgba(128, 0, 32, 0.15)",
    border: "rgba(128, 0, 32, 0.35)",
    glow: "rgba(155, 27, 48, 0.25)",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#A1A1AA",
    muted: "#71717A",
    subtle: "#52525B",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.04)",
    default: "rgba(255, 255, 255, 0.06)",
    strong: "rgba(255, 255, 255, 0.12)",
    focus: "rgba(155, 27, 48, 0.6)",
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
} as const;

export const spacing = {
  headerHeight: "64px",
  sidebarWidth: "260px",
  sidebarCollapsedWidth: "72px",
  maxContentWidth: "1280px",
} as const;

export const motion = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  },
  easeInOut: {
    duration: 0.2,
    ease: [0.16, 1, 0.3, 1],
  },
  fast: {
    duration: 0.12,
    ease: "easeOut",
  },
} as const;
