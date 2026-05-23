"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Folders,
  Plus,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { GradientButton } from "@/components/shared/GradientButton";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { COLLECTION_TYPE_EMOJIS } from "@/lib/collections";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useCollections } from "@/hooks/useCollections";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { PaymentStatus } from "@/types";

// ── Static data ───────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Create Collection", href: "/dashboard/collections/new", Icon: Plus,       green: true  },
  { label: "View Payments",     href: "/dashboard/payments",         Icon: CreditCard, green: false },
  { label: "My Collections",   href: "/dashboard/collections",      Icon: Folders,    green: false },
  { label: "Profile",          href: "/dashboard/profile",          Icon: User,       green: false },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function MonthStatusPill({ status }: { status: PaymentStatus }) {
  const isPaid    = status === "completed";
  const isPending = status === "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        isPaid    ? "bg-emerald-500/20 text-emerald-300"
        : isPending ? "bg-amber-500/20 text-amber-300"
                  : "bg-red-500/20 text-red-300"
      )}
    >
      {isPaid    ? <CheckCircle2 className="size-3" />
       : isPending ? <Clock3 className="size-3" />
                 : <XCircle className="size-3" />}
      {isPaid ? "This month: Paid" : isPending ? "This month: Pending" : "This month: Missed"}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading: walletLoading, error: walletError } = useDashboard();
  const { collections, loading: collectionsLoading } = useCollections();

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const today = new Intl.DateTimeFormat("en-TZ", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  }).format(new Date());

  const activeCollections = useMemo(
    () => collections.filter((c) => c.status === "active" || c.status === "paused"),
    [collections]
  );
  const totalAcrossCollections = useMemo(
    () => collections.reduce((sum, c) => sum + c.totalCollected, 0),
    [collections]
  );

  // Prefer showing active/paused; fall back to all collections if none active
  const displayCollections = useMemo(
    () => (activeCollections.length > 0 ? activeCollections : collections).slice(0, 3),
    [activeCollections, collections]
  );
  const hasMoreCollections = collections.length > displayCollections.length;

  const isLoading = walletLoading || collectionsLoading;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 pb-2">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="flex flex-wrap items-start justify-between gap-3"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-extrabold text-[#071a0e] sm:text-3xl">{firstName}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{today}</p>
          </div>
          <Link href="/dashboard/collections/new">
            <GradientButton className="gap-2">
              <Plus className="size-4" /> Create Collection
            </GradientButton>
          </Link>
        </motion.div>

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex min-h-80 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#035034]" />
          </div>
        )}

        {/* ── Wallet error (non-blocking — still show collections) ────────── */}
        {!walletLoading && walletError && (
          <ErrorState
            message={walletError}
            action={
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            }
          />
        )}

        {/* ── Main content ───────────────────────────────────────────────── */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, delay: 0.08 }}
            className="flex flex-col gap-6"
          >

            {/* ── Connected summary panel ─────────────────────────────────── */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-900/5">
              <div className="grid lg:grid-cols-2">

                {/* Left: Contribution wallet (dark) */}
                <div className="relative overflow-hidden bg-[#071a0e] p-6 text-white">
                  {/* Ambient glows */}
                  <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#4ade80]/15 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-12 left-1/3 size-52 rounded-full bg-[#F59E0B]/10 blur-3xl" />

                  <div className="relative z-10 flex h-full flex-col gap-5">
                    {/* Panel header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-white/10">
                          <Wallet className="size-4 text-amber-400" />
                        </span>
                        <p className="text-sm font-semibold text-white/70">My Contribution Wallet</p>
                      </div>
                      {data && <MonthStatusPill status={data.currentMonthPaymentStatus} />}
                    </div>

                    {data ? (
                      <>
                        {/* Total contributed */}
                        <div>
                          <p className="text-xs font-medium text-white/50">Total contributed</p>
                          <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                            <AnimatedNumber value={data.totalPaid} format={(v) => formatMoney(v)} />
                          </p>
                          {data.remainingAmount > 0 && (
                            <p className="mt-1 text-sm text-white/50">
                              Remaining:{" "}
                              <span className="font-semibold text-amber-300">
                                {formatMoney(data.remainingAmount)}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-white/60">
                            <span>Contribution progress</span>
                            <span className="font-bold text-amber-300">
                              {data.contributionProgressPercentage}%
                            </span>
                          </div>
                          <AnimatedProgressBar
                            value={data.contributionProgressPercentage}
                            className="bg-white/10"
                            variant="gold"
                          />
                          <p className="text-xs text-white/40">
                            {data.completedPaymentsCount} payment{data.completedPaymentsCount !== 1 ? "s" : ""} completed
                          </p>
                        </div>

                        {/* Key dates */}
                        <div className="flex flex-col gap-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Next due</span>
                            <span className="font-medium text-white/80">
                              {formatDate(data.nextDueDate)}
                            </span>
                          </div>
                          {data.lastPayment && (
                            <div className="flex justify-between">
                              <span className="text-white/50">Last payment</span>
                              <span className="font-semibold text-amber-300">
                                {formatMoney(data.lastPayment.amount)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link href="/payment/start" className="flex-1">
                            <Button className="h-10 w-full min-w-28 rounded-2xl bg-amber-400 font-bold text-amber-900 text-sm hover:bg-amber-300">
                              Pay This Month
                            </Button>
                          </Link>
                          <Link href="/dashboard/payments">
                            <Button
                              variant="outline"
                              className="h-10 rounded-2xl border-white/20 bg-white/5 px-4 text-sm text-white hover:bg-white/10"
                            >
                              History
                            </Button>
                          </Link>
                        </div>
                      </>
                    ) : (
                      /* Wallet data unavailable (error path) */
                      <div className="flex flex-1 items-center justify-center py-8">
                        <p className="text-sm text-white/40">Wallet data unavailable.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Collections summary (light) */}
                <div className="flex flex-col gap-5 border-t border-slate-100 bg-white/80 p-6 lg:border-l lg:border-t-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-green-50">
                        <Folders className="size-4 text-[#16a34a]" />
                      </span>
                      <p className="text-sm font-semibold text-[#071a0e]">My Collections</p>
                    </div>
                    {collections.length > 0 && (
                      <Link href="/dashboard/collections">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 rounded-xl text-xs text-[#16a34a] hover:bg-green-50 hover:text-[#16a34a]"
                        >
                          View all <ArrowRight className="size-3" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-green-50 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Total raised</p>
                      <p className="mt-0.5 truncate text-lg font-extrabold text-[#16a34a]">
                        {formatMoney(totalAcrossCollections)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="mt-0.5 text-lg font-extrabold text-amber-700">
                        {activeCollections.length}
                      </p>
                    </div>
                  </div>

                  {/* Collection mini-list or empty state */}
                  {collections.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-green-200 py-8 text-center">
                      <Folders className="size-8 text-muted-foreground/30" />
                      <div>
                        <p className="text-sm font-semibold text-[#071a0e]">No collections yet</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Create your first money collection project or event.
                        </p>
                      </div>
                      <Link href="/dashboard/collections/new">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs">
                          <Plus className="mr-1 size-3" /> Create one
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-slate-100">
                      {displayCollections.map((c) => {
                        const progress = c.targetAmount
                          ? Math.min(
                              100,
                              Math.round((c.totalCollected / c.targetAmount) * 100)
                            )
                          : null;
                        return (
                          <Link
                            key={c._id}
                            href={`/dashboard/collections/${c._id}`}
                            className="group flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-base">
                                  {COLLECTION_TYPE_EMOJIS[c.collectionType] ?? "💰"}
                                </span>
                                <p className="truncate text-sm font-semibold text-[#071a0e] transition-colors group-hover:text-[#16a34a]">
                                  {c.title}
                                </p>
                              </div>
                              <StatusBadge
                                status={c.status}
                                className="shrink-0 px-2 py-0.5 text-[10px]"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-[#16a34a]">
                                {formatMoney(c.totalCollected, c.currency)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.contributorCount}{" "}
                                contributor{c.contributorCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                            {progress !== null && (
                              <AnimatedProgressBar
                                value={progress}
                                variant="green"
                                className="h-1.5 bg-slate-200/60"
                              />
                            )}
                          </Link>
                        );
                      })}

                      {hasMoreCollections && (
                        <Link href="/dashboard/collections" className="block pt-3">
                          <p className="text-xs font-semibold text-[#16a34a] hover:underline">
                            + View all {collections.length} collection
                            {collections.length !== 1 ? "s" : ""} →
                          </p>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Recent payments feed ────────────────────────────────────── */}
            {data && data.recentPayments.length > 0 && (
              <ActivityFeed payments={data.recentPayments} />
            )}

            {/* ── Quick actions ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map(({ label, href, Icon, green }) => (
                <Link key={label} href={href}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-3xl border p-4 text-center shadow-sm transition-shadow hover:shadow-md",
                      green
                        ? "border-green-200/60 bg-green-50/80 hover:bg-green-50"
                        : "border-slate-200/60 bg-white/85 hover:bg-white/90"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-2xl shadow-sm",
                        green
                          ? "bg-[#035034] text-white"
                          : "bg-slate-100 text-[#071a0e]"
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        green ? "text-[#035034]" : "text-[#071a0e]"
                      )}
                    >
                      {label}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
