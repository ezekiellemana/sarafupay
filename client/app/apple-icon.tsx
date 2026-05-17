import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #071a0e 0%, #0d3a1f 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Gold accent dot */}
        <div
          style={{
            position: "absolute",
            top: 26,
            right: 26,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#F59E0B",
            boxShadow: "0 0 20px rgba(245,158,11,0.7)",
          }}
        />
        {/* S lettermark */}
        <span
          style={{
            color: "#4ade80",
            fontSize: 112,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "sans-serif",
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
