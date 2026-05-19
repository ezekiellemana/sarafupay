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
          "h-11 rounded-2xl px-5 font-bold",
          isGold
            ? "bg-[#C4A237] text-[#035034] shadow-lg shadow-[#C4A237]/25 hover:bg-[#d4af45]"
            : "bg-[#035034] text-white shadow-lg shadow-[#035034]/25 hover:bg-[#024028]",
          glow && !isGold && "hover:shadow-[#035034]/30",
          glow && isGold && "hover:shadow-[#C4A237]/30",
          className
        )}
        {...props}
      />
    </motion.div>
  );
}
