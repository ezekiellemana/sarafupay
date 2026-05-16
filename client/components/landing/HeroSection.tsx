"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Coins, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { GradientButton } from "@/components/shared/GradientButton";
import { CoinStack } from "@/components/shared/illustrations/CoinStack";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";
import { FloatingCoins } from "@/components/shared/illustrations/FloatingCoins";

export function HeroSection() {
  return (
    <section className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_0.9fr] md:items-center md:py-20">
      <FloatingCoins count={5} opacity={0.18} />

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200/60 bg-amber-50/80 px-4 py-1.5 text-xs font-semibold text-amber-700 backdrop-blur-sm">
          <GoldCoin size={16} />
          Tanzania&apos;s group contribution platform
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-[#071a0e] md:text-7xl">
            SarafuPay
            <span className="block sarafu-gradient-text-gold">Lipa kwa urahisi.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            A simple and secure way to pay, track, and manage group contributions with Snippe checkout and clean wallet records.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/payment/start">
            <GradientButton btnVariant="gold">
              Pay Contribution
              <ArrowRight data-icon="inline-end" />
            </GradientButton>
          </Link>
          <Link href="/dashboard">
            <GradientButton>Open Dashboard</GradientButton>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="ghost" className="rounded-2xl">Create Account</Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/70 px-3 py-2 font-medium text-amber-800 backdrop-blur-sm">
            <Coins className="size-4 text-amber-600" />
            Monthly contributions tracked
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-border backdrop-blur-sm">
            <LockKeyhole className="size-4 text-primary" />
            Webhook-confirmed payments
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        className="relative"
      >
        {/* Floating coin decorations around the card */}
        <motion.div
          className="absolute -right-6 -top-8 z-10"
          animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <CoinStack size={70} animate={false} />
        </motion.div>
        <motion.div
          className="absolute -bottom-4 -left-4 z-10"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          <GoldCoin size={36} animate={false} />
        </motion.div>
        <motion.div
          className="absolute -right-3 bottom-10 z-10"
          animate={{ y: [0, -8, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3.5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <GoldCoin size={26} animate={false} />
        </motion.div>

        <Card className="glass-premium border-0 shadow-2xl shadow-slate-900/12">
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Wallet overview</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-[#071a0e]">35,000 TZS</p>
              </div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 coin-glow">
                <GoldCoin size={32} animate={false} />
              </span>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-[#071a0e] p-5 text-white">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-400/10 blur-2xl" />
              <p className="relative text-sm text-white/70">Group Monthly Contribution</p>
              <div className="relative mt-5 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">70%</p>
                  <p className="text-sm text-white/70">Project progress</p>
                </div>
                <p className="text-sm font-medium text-amber-300">5,000 TZS due</p>
              </div>
              <AnimatedProgressBar value={70} className="mt-4 bg-white/15" variant="gold" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Status", "Completed", "text-[#16A34A] font-semibold"],
                ["Next due", "Jun 5, 2026", "text-[#071a0e]"],
                ["Reference", "SPY-202605-A1B2", "text-[#071a0e] font-mono text-xs"],
                ["Method", "Mobile money", "text-[#071a0e]"]
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-xl border border-white/70 bg-white/60 p-3 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-sm ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
