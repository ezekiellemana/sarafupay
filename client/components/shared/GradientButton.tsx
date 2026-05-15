"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GradientButtonVariant = "default" | "gold";

type GradientButtonProps = React.ComponentProps<typeof Button> & {
  glow?: boolean;
  btnVariant?: GradientButtonVariant;
};

export function GradientButton({ className, glow = true, btnVariant = "default", ...props }: GradientButtonProps) {
  const isGold = btnVariant === "gold";
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex">
      <Button
        className={cn(
          "h-11 rounded-2xl px-5 text-white",
          isGold
            ? "bg-linear-to-r from-amber-500 via-yellow-400 to-amber-300 text-amber-900 shadow-lg shadow-amber-500/30 hover:brightness-105"
            : "bg-linear-to-r from-[#052e16] via-[#16a34a] to-[#4ade80] shadow-lg shadow-green-700/20 hover:brightness-105",
          glow && !isGold && "hover:shadow-green-600/30",
          glow && isGold && "hover:shadow-amber-500/40",
          className
        )}
        {...props}
      />
    </motion.div>
  );
}
