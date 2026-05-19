"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Folders, FolderKanban, History, Shield, User, Users } from "lucide-react";
import { adminNav, memberNav } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <BarChart3 className="size-5" />,
  "My Projects": <Folders className="size-5" />,
  Payments: <History className="size-5" />,
  Profile: <User className="size-5" />,
  "Platform Overview": <Shield className="size-5" />,
  Projects: <FolderKanban className="size-5" />,
  Members: <Users className="size-5" />,
};

export function MobileNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const items = (admin ? adminNav : memberNav).slice(0, 4);

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-white/10 bg-[#071a0e]/95 px-1 shadow-2xl shadow-green-950/40 backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        const label = item.label.replace("Platform ", "");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[11px] font-medium transition-colors duration-200",
              active ? "text-[#C4A237]" : "text-white/55 hover:text-white/75",
            )}
          >
            {active && (
              <>
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 rounded-2xl bg-[#C4A237]/12"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
                <motion.span
                  layoutId="mobile-nav-dot"
                  className="absolute top-1.5 size-1.5 rounded-full bg-[#C4A237] shadow-sm shadow-[#C4A237]/60"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              </>
            )}
            <span className="relative">{iconMap[item.label]}</span>
            <span className={cn("relative truncate leading-none", active && "font-semibold")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
