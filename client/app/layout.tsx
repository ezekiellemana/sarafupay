import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteDescription =
  "Create a payment collection page for weddings, events, groups, and projects in Tanzania. Accept M-Pesa and card payments through a simple, shareable link.";

export const metadata: Metadata = {
  title: {
    default: "SarafuPay — Lipa kwa urahisi",
    template: "%s | SarafuPay",
  },
  description: siteDescription,
  keywords: ["payment collection", "Tanzania", "M-Pesa", "group contributions", "chama", "event payments", "Snippe", "SarafuPay"],
  openGraph: {
    type: "website",
    locale: "en_TZ",
    siteName: "SarafuPay",
    title: "SarafuPay — Lipa kwa urahisi",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "SarafuPay — Lipa kwa urahisi",
    description: siteDescription,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jakartaSans.variable} ${geistMono.variable}`}>
        <PostHogProvider>
          <AuthProvider>
            <MotionProvider>
              {children}
            </MotionProvider>
          </AuthProvider>
        </PostHogProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
