"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Ban, CheckCircle2, Clock, LockKeyhole, ShieldCheck, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";
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
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <GoldCoin size={48} animate={true} />
          <p>Loading collection…</p>
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
        <Link href="/" className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/75 px-4 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#071a0e] text-white">
            <WalletCards className="size-4" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[#071a0e]">SarafuPay</span>
            <span className="text-[9px] sarafu-gradient-text-gold font-semibold">Lipa kwa urahisi</span>
          </div>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="payerName">Full name *</Label>
                <Input id="payerName" placeholder="John Doe" className="rounded-2xl" {...register("payerName", { required: "Full name is required." })} />
                {errors.payerName && <p className="text-sm text-destructive">{errors.payerName.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="payerPhone">Phone number *</Label>
                <Input id="payerPhone" type="tel" placeholder="0712345678" className="rounded-2xl" {...register("payerPhone", { required: "Phone number is required." })} />
                {errors.payerPhone && <p className="text-sm text-destructive">{errors.payerPhone.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="payerEmail">Email <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="payerEmail" type="email" placeholder="john@example.com" className="rounded-2xl" {...register("payerEmail")} />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">
                  Amount ({collection.currency}) *
                  {!collection.allowCustomAmount && <span className="ml-2 text-xs text-muted-foreground">Fixed amount</span>}
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
                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                              amountValue === String(amt)
                                ? "border-[#16a34a] bg-green-50 text-[#16a34a]"
                                : "border-white/70 bg-white/60 text-muted-foreground hover:border-[#16a34a]/50"
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
                      className="rounded-2xl"
                      {...register("amount", {
                        required: "Amount is required.",
                        min: { value: 1, message: "Amount must be at least 1." }
                      })}
                    />
                  </div>
                ) : (
                  <>
                    {/* Hidden registered field so react-hook-form includes amount in submit values */}
                    <input type="hidden" {...register("amount", { required: true })} />
                    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3">
                      <p className="text-xl font-bold sarafu-gradient-text-gold">
                        {formatMoney(collection.suggestedAmount ?? 0, collection.currency)}
                      </p>
                    </div>
                  </>
                )}
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="payerMessage">Message <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="payerMessage" placeholder="Any message for the owner..." className="rounded-2xl" {...register("payerMessage")} />
              </div>

              <button
                type="submit"
                disabled={paying}
                className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 via-yellow-400 to-amber-300 text-sm font-bold text-amber-900 shadow-lg shadow-amber-500/30 transition-all hover:brightness-105 disabled:opacity-60"
              >
                {paying ? "Creating payment…" : (
                  <>
                    <GoldCoin size={20} animate={false} />
                    Pay Now →
                  </>
                )}
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

      {/* Footer */}
      <div className="mt-10 text-center text-xs text-muted-foreground">
        Powered by <Link href="/" className="font-medium text-[#16a34a] hover:underline">SarafuPay</Link> · Secure payments via Snippe
      </div>
    </main>
  );
}
