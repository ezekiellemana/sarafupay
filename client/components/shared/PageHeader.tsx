"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}
    >
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#0B1F3A] md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </motion.div>
  );
}
