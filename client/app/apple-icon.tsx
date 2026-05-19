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
          background: "#035034",
          border: "7px solid #C4A237",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Subtle inner highlight ring */}
        <div
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: 30,
            border: "1px solid rgba(242,211,122,0.35)",
          }}
        />
        <span
          style={{
            color: "#C4A237",
            fontSize: 108,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "serif",
            marginTop: 8,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
