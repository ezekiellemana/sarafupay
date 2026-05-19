"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { GradientButton } from "@/components/shared/GradientButton";

function WalletIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <circle cx="30" cy="30" r="29" fill="#035034" />
      <circle cx="30" cy="30" r="29" fill="none" stroke="#C4A237" strokeWidth="3" />
      <circle cx="30" cy="30" r="24.5" fill="none" stroke="#F2D37A" strokeWidth="0.75" opacity="0.45" />
      <text
        x="30"
        y="42"
        textAnchor="middle"
        fontSize="34"
        fontWeight="900"
        fill="#C4A237"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        S
      </text>
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_0.9fr] md:items-center md:py-20">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200/60 bg-amber-50/80 px-4 py-1.5 text-xs font-semibold text-amber-700 backdrop-blur-sm">
          <TrendingUp className="size-3.5 text-amber-600" />
          Tanzania&apos;s group contribution platform
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-[#035034] md:text-7xl">
            SarafuPay
            <span className="block sarafu-gradient-text-gold">Powering Payments.</span>
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
            <TrendingUp className="size-4 text-amber-600" />
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
        <Card className="glass-premium border-0 shadow-2xl shadow-slate-900/12">
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Wallet overview</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-[#035034]">35,000 TZS</p>
              </div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#035034]/8 ring-1 ring-[#C4A237]/30">
                <WalletIcon />
              </span>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-[#035034] p-5 text-white">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-[#C4A237]/10 blur-2xl" />
              <p className="relative text-sm text-white/70">Group Monthly Contribution</p>
              <div className="relative mt-5 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">70%</p>
                  <p className="text-sm text-white/70">Project progress</p>
                </div>
                <p className="text-sm font-medium text-[#F2D37A]">5,000 TZS due</p>
              </div>
              <AnimatedProgressBar value={70} className="mt-4 bg-white/15" variant="gold" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Status", "Completed", "text-[#19A254] font-semibold"],
                ["Next due", "Jun 5, 2026", "text-[#035034]"],
                ["Reference", "SPY-202605-A1B2", "text-[#035034] font-mono text-xs"],
                ["Method", "Mobile money", "text-[#035034]"]
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
