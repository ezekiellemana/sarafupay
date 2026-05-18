"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, Ban, CheckCircle2, Clock, Loader2, LockKeyhole, ShieldCheck, Store, Users } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { collectionsApi, COLLECTION_TYPE_EMOJIS, COLLECTION_TYPE_LABELS } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Collection } from "@/types";

type FormValues = {
  payerName: string;
  payerPhone: string;
  payerEmail: string;
  amount: string;
  payerMessage: string;
};

export default function PublicPayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { payerName: "", payerPhone: "", payerEmail: "", amount: "", payerMessage: "" }
  });

  const amountValue = watch("amount");

  useEffect(() => {
    collectionsApi.getPublic(slug)
      .then((res) => {
        setCollection(res.data.collection);
        if (!res.data.collection.allowCustomAmount && res.data.collection.suggestedAmount) {
          setValue("amount", String(res.data.collection.suggestedAmount));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!collection) return;
    setPaying(true);
    try {
      const res = await collectionsApi.createPublicSession({
        collectionSlug: slug,
        payerName: values.payerName,
        payerPhone: values.payerPhone,
        payerEmail: values.payerEmail || undefined,
        amount: Number(values.amount),
        payerMessage: values.payerMessage || undefined
      });
      window.location.href = res.data.checkout_url;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Unable to create payment. Please try again."));
      setPaying(false);
    }
  };

  const progress = collection?.targetAmount && collection.totalCollected
    ? Math.min(100, Math.round((collection.totalCollected / collection.targetAmount) * 100))
    : 0;

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
        <FloatingBlobBackground />
        <div className="flex flex-col items-center gap-5">
          <BrandLogo variant="light" height={42} />
          <div className="size-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
        </div>
      </main>
    );
  }

  if (notFound || !collection) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
        <FloatingBlobBackground />
        <div className="text-center">
          <p className="text-6xl mb-4">😔</p>
          <h1 className="text-2xl font-bold text-[#071a0e]">Collection not found</h1>
          <p className="mt-2 text-muted-foreground">This payment link may have expired or doesn&apos;t exist.</p>
          <Link href="/"><Button className="mt-6 rounded-2xl" variant="outline">Go Home</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
      <FloatingBlobBackground />

      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Link href="/" className="flex items-center rounded-2xl border border-white/70 bg-white/75 px-4 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <BrandLogo variant="light" height={42} />
        </Link>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        {/* Left: Collection info */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5"
        >
          {/* Collection header */}
          <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-900/8 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-3xl ring-1 ring-amber-200/60">
                {COLLECTION_TYPE_EMOJIS[collection.collectionType] ?? "💰"}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {COLLECTION_TYPE_LABELS[collection.collectionType]}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-[#071a0e] leading-tight">{collection.title}</h1>
                {collection.ownerName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Store className="size-3 shrink-0 text-amber-600" />
                    Organized by <span className="font-medium text-[#071a0e]">{collection.ownerName}</span>
                  </p>
                )}
                {collection.description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{collection.description}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-green-50/80 px-4 py-3">
                <p className="text-xs text-muted-foreground">Collected so far</p>
                <p className="mt-0.5 text-lg font-bold text-[#16a34a]">{formatMoney(collection.totalCollected, collection.currency)}</p>
              </div>
              <div className="rounded-2xl bg-amber-50/80 px-4 py-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="size-3" /> Contributors</p>
                <p className="mt-0.5 text-lg font-bold text-amber-700">{collection.contributorCount}</p>
              </div>
            </div>

            {/* Progress */}
            {collection.targetAmount && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Towards {formatMoney(collection.targetAmount, collection.currency)}</span>
                  <span className="font-semibold text-[#16a34a]">{progress}%</span>
                </div>
                <AnimatedProgressBar value={progress} variant="gold" />
              </div>
            )}

            {/* Dates */}
            {(collection.startDate || collection.endDate) && (
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {collection.startDate && <span>Start: {formatDate(collection.startDate)}</span>}
                {collection.endDate && <span>Ends: {formatDate(collection.endDate)}</span>}
              </div>
            )}
          </div>

          {/* Trust notes */}
          <div className="flex flex-col gap-2">
            {[
              { icon: <ShieldCheck className="size-4 text-[#16a34a]" />, text: "Secure checkout powered by Snippe" },
              { icon: <CheckCircle2 className="size-4 text-[#16a34a]" />, text: "Your payment will be recorded automatically after confirmation" },
              { icon: <LockKeyhole className="size-4 text-[#16a34a]" />, text: "SarafuPay does not store your card details" }
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Payment form */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            {collection.status === "paused" ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200/60">
                  <Clock className="size-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#071a0e]">Temporarily paused</h2>
                  <p className="mt-1 text-sm text-muted-foreground">This collection is not accepting payments right now. Check back soon.</p>
                </div>
              </div>
            ) : collection.status === "closed" ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200/60">
                  <Ban className="size-7 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#071a0e]">Collection closed</h2>
                  <p className="mt-1 text-sm text-muted-foreground">This collection is no longer accepting payments. Thank you for your support!</p>
                </div>
              </div>
            ) : (
              <>
            <h2 className="text-lg font-bold text-[#071a0e]">Support this project</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your details and pay securely.</p>

            <form method="post" onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payerName" className="text-sm font-semibold text-[#0B1F3A]">Full name *</Label>
                <Input id="payerName" placeholder="John Doe" className="h-11 rounded-2xl" {...register("payerName", { required: "Full name is required." })} />
                {errors.payerName && <p className="text-xs font-medium text-destructive">{errors.payerName.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payerPhone" className="text-sm font-semibold text-[#0B1F3A]">Phone number *</Label>
                <Input id="payerPhone" type="tel" placeholder="0712345678" className="h-11 rounded-2xl" {...register("payerPhone", { required: "Phone number is required." })} />
                {errors.payerPhone && <p className="text-xs font-medium text-destructive">{errors.payerPhone.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payerEmail" className="text-sm font-semibold text-[#0B1F3A]">Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="payerEmail" type="email" placeholder="john@example.com" className="h-11 rounded-2xl" {...register("payerEmail")} />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount" className="text-sm font-semibold text-[#0B1F3A]">
                  Amount ({collection.currency}) *
                  {!collection.allowCustomAmount && <span className="ml-2 font-normal text-xs text-muted-foreground">Fixed</span>}
                </Label>
                {collection.allowCustomAmount ? (
                  <div className="flex flex-col gap-2">
                    {collection.suggestedAmount && (
                      <div className="flex flex-wrap gap-2">
                        {[collection.suggestedAmount, collection.suggestedAmount * 2, collection.suggestedAmount * 5].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setValue("amount", String(amt))}
                            className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                              amountValue === String(amt)
                                ? "border-[#16a34a] bg-green-50 text-[#16a34a] shadow-sm"
                                : "border-slate-200 bg-white/80 text-slate-600 hover:border-[#16a34a]/50 hover:text-[#16a34a]"
                            }`}
                          >
                            {formatMoney(amt, collection.currency)}
                          </button>
                        ))}
                      </div>
                    )}
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      className="h-11 rounded-2xl"
                      {...register("amount", {
                        required: "Amount is required.",
                        min: { value: 1, message: "Amount must be at least 1." }
                      })}
                    />
                  </div>
                ) : (
                  <>
                    <input type="hidden" {...register("amount", { required: true })} />
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3.5">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-amber-400/15">
                        <ShieldCheck className="size-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-amber-700/70">Fixed contribution</p>
                        <p className="text-xl font-bold sarafu-gradient-text-gold leading-tight">
                          {formatMoney(collection.suggestedAmount ?? 0, collection.currency)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {errors.amount && <p className="text-xs font-medium text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payerMessage" className="text-sm font-semibold text-[#0B1F3A]">Message <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="payerMessage" placeholder="Any message for the organizer…" className="h-11 rounded-2xl" {...register("payerMessage")} />
              </div>

              <button
                type="submit"
                disabled={paying}
                className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 via-yellow-400 to-amber-300 text-sm font-bold text-amber-900 shadow-lg shadow-amber-500/30 transition-[filter,opacity] hover:brightness-105 disabled:opacity-60"
              >
                {paying
                  ? <><Loader2 className="size-4 animate-spin" /> Creating payment…</>
                  : <>Pay Now <ArrowRight className="size-4" /></>
                }
              </button>

              <p className="text-center text-xs text-muted-foreground">
                You&apos;ll be redirected to Snippe secure checkout to complete payment.
              </p>
            </form>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent contributors */}
      {collection.recentContributors !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mx-auto mt-6 max-w-5xl rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-4 text-[#16a34a]" />
            <h2 className="font-semibold text-[#071a0e]">Recent Contributors</h2>
          </div>

          {collection.recentContributors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No contributions yet — be the first!</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {collection.recentContributors.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-[#16a34a]">
                      {c.name[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="text-sm font-medium text-[#071a0e]">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-amber-700">{formatMoney(c.amount, collection.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Footer */}
      <div className="mt-10 text-center text-xs text-muted-foreground">
        Powered by <Link href="/" className="font-medium text-[#16a34a] hover:underline">SarafuPay</Link> · Secure payments via Snippe
      </div>
    </main>
  );
}
