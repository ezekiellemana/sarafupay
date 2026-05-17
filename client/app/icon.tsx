import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
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
            top: 5,
            right: 5,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#F59E0B",
            boxShadow: "0 0 6px rgba(245,158,11,0.8)",
          }}
        />
        {/* S lettermark */}
        <span
          style={{
            color: "#4ade80",
            fontSize: 20,
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
