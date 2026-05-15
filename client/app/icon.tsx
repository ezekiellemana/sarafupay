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
          background: "linear-gradient(135deg, #052e16 0%, #16a34a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)",
            border: "2.5px solid rgba(255,255,255,0.35)",
            boxShadow: "0 0 8px rgba(245,158,11,0.6)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
