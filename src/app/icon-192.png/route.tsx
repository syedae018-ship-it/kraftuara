import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 90,
          background: "linear-gradient(135deg, #780016 0%, #1a0004 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 900,
          borderRadius: "40px",
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
        }}
      >
        KA
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}
