import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 84,
          background: "linear-gradient(135deg, #780016 0%, #1a0004 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 900,
          borderRadius: "36px",
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
          boxShadow: "inset 0 0 20px rgba(255,255,255,0.15)",
        }}
      >
        KA
      </div>
    ),
    {
      ...size,
    }
  );
}
