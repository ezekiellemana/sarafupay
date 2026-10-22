import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no build-time call to Google Fonts).
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/onest/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SarafuPay — michango on WhatsApp, with mobile money",
  description:
    "An AI agent in WhatsApp that runs michango — weddings, funerals, medical bills, NGOs. Friends pay with mobile money or card; every payout is reported.",
};

export const viewport: Viewport = { themeColor: "#0e3b2c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
