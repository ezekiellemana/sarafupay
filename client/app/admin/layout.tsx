import type { Metadata } from "next";
import { AdminGuard } from "@/components/auth/AdminGuard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
