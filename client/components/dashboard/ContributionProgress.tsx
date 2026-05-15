"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { MoneyBag } from "@/components/shared/illustrations/MoneyBag";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";

export function ContributionProgress({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 12);

  return (
    <Card className="glass-gold border shadow-xl shadow-amber-900/8 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#0B1F3A]">Contribution Progress</CardTitle>
          <MoneyBag size={44} animate={true} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <p className="text-4xl font-bold sarafu-gradient-text-gold">{value}%</p>
          <p className="text-sm text-muted-foreground">of annual target</p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
          <AnimatedProgressBar value={value} variant="gold" />
        </motion.div>
        {/* Coin visualization */}
        <div className="mt-1">
          <p className="mb-2 text-xs text-muted-foreground">{filled} of 12 monthly coins</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <GoldCoin size={22} animate={false} outline={i >= filled} />
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
