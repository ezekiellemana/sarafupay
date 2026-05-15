"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { CollectionForm } from "@/components/collections/CollectionForm";
import type { Collection } from "@/types";

export default function NewCollectionPage() {
  const [created, setCreated] = useState<Collection | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSuccess = (collection: Collection) => {
    setCreated(collection);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyLink = () => {
    if (created?.publicPaymentLink) {
      navigator.clipboard.writeText(created.publicPaymentLink);
      setCopied(true);
      toast.success("Payment link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/dashboard/collections">
            <Button variant="ghost" className="gap-2 rounded-2xl text-muted-foreground hover:text-[#071a0e]">
              <ArrowLeft className="size-4" /> Back to My Projects
            </Button>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {created ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-6"
            >
              <div className="rounded-3xl border border-green-200/60 bg-green-50/80 p-6 text-center shadow-xl shadow-green-900/5">
                <div className="mb-4 flex justify-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-green-500/15 text-4xl ring-4 ring-green-200/60">
                    🎉
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#071a0e]">{created.title}</h2>
                <p className="mt-2 text-muted-foreground">Your project/event is live! Share the payment link below.</p>
              </div>

              <div className="glass-gold rounded-3xl p-6">
                <p className="text-sm font-semibold text-amber-800">Your Payment Link</p>
                <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-2xl border border-amber-200/60 bg-white/70 px-3 py-2.5">
                  <ExternalLink className="size-4 shrink-0 text-amber-600" />
                  <span className="flex-1 truncate text-sm font-medium text-[#071a0e]">{created.publicPaymentLink}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={copyLink}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors"
                  >
                    {copied ? <><Check className="size-4" /> Copied!</> : <><Copy className="size-4" /> Copy Payment Link</>}
                  </button>
                  <Link href={`/dashboard/collections/${created._id}`}>
                    <Button className="h-11 rounded-2xl" variant="outline">View Dashboard</Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                <p className="font-semibold text-[#071a0e]">What&apos;s next?</p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  {[
                    "Share the payment link with people you want to contribute.",
                    "They'll open the link and pay securely through Snippe.",
                    "You'll see all contributions in your collection dashboard.",
                    "Export a CSV report of all contributors anytime."
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/dashboard/collections">
                <Button className="h-11 w-full rounded-2xl" variant="outline">← Back to My Projects</Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <PageHeader
                eyebrow="New collection"
                title="Create Project/Event"
                description="Set up your money collection project. You'll get a shareable payment link immediately."
              />
              <div className="mt-6 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-900/8 backdrop-blur-xl">
                <CollectionForm onSuccess={handleSuccess} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
