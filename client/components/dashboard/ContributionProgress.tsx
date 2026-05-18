"use client";

import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";

export function ContributionProgress({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 12);

  return (
    <Card className="glass-gold border shadow-xl shadow-amber-900/8 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#0B1F3A]">Contribution Progress</CardTitle>
          <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/20">
            <Target className="size-5 text-amber-600" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <p className="text-4xl font-bold sarafu-gradient-text-gold">{value}%</p>
          <p className="text-sm text-muted-foreground">of annual target</p>
        </div>
        <AnimatedProgressBar value={value} variant="gold" />
        <div className="mt-1">
          <p className="mb-2 text-xs text-muted-foreground">{filled} of 12 monthly payments</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className={`inline-block size-5 rounded-full border-2 transition-colors ${
                  i < filled
                    ? "border-amber-400 bg-amber-400 shadow-sm shadow-amber-400/30"
                    : "border-amber-200/60 bg-amber-50/40"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
