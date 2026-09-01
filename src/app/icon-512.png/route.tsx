import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 240,
          background: "linear-gradient(135deg, #780016 0%, #1a0004 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 900,
          borderRadius: "100px",
          fontFamily: "sans-serif",
          letterSpacing: "-6px",
          boxShadow: "inset 0 0 60px rgba(255,255,255,0.15)",
        }}
      >
        KA
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
