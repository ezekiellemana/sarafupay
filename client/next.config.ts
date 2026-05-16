import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.30"],
  turbopack: {
    root: path.resolve(__dirname, "..")
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_PROXY_URL ?? "http://127.0.0.1:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
