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
          background: "linear-gradient(135deg, #052e16 0%, #16a34a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)",
            border: "6px solid rgba(255,255,255,0.3)",
            boxShadow: "0 0 40px rgba(245,158,11,0.55)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
