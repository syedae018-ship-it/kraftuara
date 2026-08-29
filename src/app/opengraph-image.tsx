import { ImageResponse } from "next/og";

export const alt = "Kraftaura – Online Store Builder for Small Businesses in India";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#080808",
          backgroundImage: "radial-gradient(circle at 50% 20%, rgba(120, 0, 22, 0.4) 0%, rgba(8, 8, 8, 1) 70%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #780016 0%, #200005 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            KA
          </div>
          <div
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              display: "flex",
            }}
          >
            Kraft<span style={{ color: "#d4d4d8", fontWeight: 400 }}>aura</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "52px",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: "960px",
            marginBottom: "24px",
            letterSpacing: "-1px",
          }}
        >
          Build Your Online Store in Minutes
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          The online store platform for small businesses in India. Sell through WhatsApp, accept online payments, and manage orders seamlessly.
        </div>
        <div
          style={{
            marginTop: "36px",
            display: "flex",
            alignItems: "center",
            padding: "8px 24px",
            borderRadius: "999px",
            background: "rgba(120, 0, 22, 0.4)",
            border: "1px solid rgba(225, 29, 72, 0.4)",
            color: "#fda4af",
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          kraftaura.in
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
