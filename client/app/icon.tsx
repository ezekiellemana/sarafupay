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
          background: "#035034",
          border: "2.5px solid #C4A237",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#C4A237",
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "serif",
            marginTop: 1,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
