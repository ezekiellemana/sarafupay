"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Folders, FolderKanban, History, Shield, User } from "lucide-react";
import { adminNav, memberNav } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <BarChart3 />,
  "My Projects": <Folders />,
  Payments: <History />,
  Project: <FolderKanban />,
  Profile: <User />,
  "Admin Dashboard": <Shield />,
  Projects: <FolderKanban />,
  Members: <User />
};

export function MobileNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const items = (admin ? adminNav : memberNav).slice(0, 4);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-white/70 bg-white/90 px-2 py-2 shadow-2xl shadow-slate-900/15 backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-2xl py-2 text-xs transition-all",
              active
                ? "bg-linear-to-t from-amber-400/20 to-blue-400/10 text-amber-700 font-medium"
                : "text-muted-foreground hover:text-[#0B1F3A]"
            )}
          >
            {/* Gold active indicator dot */}
            {active && (
              <motion.span
                layoutId="mobile-nav-dot"
                className="absolute -top-0.5 size-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"
              />
            )}
            <motion.span
              animate={active ? { y: [0, -2, 0] } : { y: 0 }}
              transition={{ duration: 0.35 }}
              className={cn("size-5", active ? "text-amber-600" : "")}
            >
              {iconMap[item.label]}
            </motion.span>
            <span className="truncate">{item.label.replace("Admin ", "")}</span>
          </Link>
        );
      })}
    </nav>
  );
}
