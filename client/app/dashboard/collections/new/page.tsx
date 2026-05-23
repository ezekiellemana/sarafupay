"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { COLLECTION_TEMPLATES, type CollectionTemplate } from "@/lib/templates";
import { formatMoney } from "@/lib/formatters";
import type { Collection } from "@/types";

type Step = "pick" | "form";

export default function NewCollectionPage() {
  const [step, setStep] = useState<Step>("pick");
  const [selectedTemplate, setSelectedTemplate] = useState<CollectionTemplate | null>(null);
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

  const handleContinue = () => {
    if (selectedTemplate) setStep("form");
  };

  const handleBackToPicker = () => {
    setStep("pick");
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/dashboard/collections">
            <Button variant="ghost" className="gap-2 rounded-2xl text-muted-foreground hover:text-[#071a0e]">
              <ArrowLeft className="size-4" /> My Collections
            </Button>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Success state ── */}
          {created ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-6"
            >
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm shadow-[#0a1f12]/4">
                <div className="mb-4 flex justify-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-green-100 text-4xl ring-4 ring-green-200">
                    🎉
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#071a0e]">{created.title}</h2>
                <p className="mt-2 text-muted-foreground">Your project/event is live! Share the payment link below.</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-[#fffbf0] p-6">
                <p className="text-sm font-semibold text-amber-800">Your Payment Link</p>
                <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-xl border border-amber-200 bg-white px-3 py-2.5">
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

              <div className="rounded-2xl border border-[#e5e0d6] bg-white p-5 shadow-sm shadow-[#0a1f12]/4">
                <p className="font-semibold text-[#071a0e]">What&apos;s next?</p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  {[
                    "Share the payment link with people you want to contribute.",
                    "They'll open the link and pay securely through Snippe.",
                    "You'll see all contributions in your collection dashboard.",
                    "Export a CSV report of all contributors anytime."
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/dashboard/collections">
                <Button className="h-11 w-full rounded-2xl" variant="outline">← My Collections</Button>
              </Link>
            </motion.div>

          ) : step === "pick" ? (
            /* ── Template picker ── */
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New collection</p>
                <h1 className="mt-1 text-2xl font-bold text-[#071a0e]">Choose a template</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a starting point — you can edit every detail before creating.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {COLLECTION_TEMPLATES.map((template) => {
                  const isSelected = selectedTemplate?.key === template.key;
                  return (
                    <motion.button
                      key={template.key}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTemplate(template)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-150 ${
                        isSelected
                          ? "border-[#16a34a] bg-green-50 shadow-sm shadow-[#0a1f12]/4 ring-2 ring-[#16a34a]/25"
                          : "border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4 hover:border-[#16a34a]/40 hover:bg-green-50/50"
                      }`}
                    >
                      <span className="text-3xl leading-none">{template.emoji}</span>
                      <p className={`mt-2.5 text-sm font-semibold leading-tight ${isSelected ? "text-[#16a34a]" : "text-[#071a0e]"}`}>
                        {template.name}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">
                        {template.tagline}
                      </p>
                      {template.defaults.suggestedAmount && (
                        <p className="mt-2 text-xs font-medium text-amber-600">
                          ~{formatMoney(template.defaults.suggestedAmount, template.defaults.currency ?? "TZS")}
                        </p>
                      )}
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#16a34a]">
                          <Check className="size-3" /> Selected
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e5e0d6] bg-white px-5 py-4 shadow-sm shadow-[#0a1f12]/4">
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate
                    ? <><span className="font-medium text-[#071a0e]">{selectedTemplate.emoji} {selectedTemplate.name}</span> selected</>
                    : "Select a template above to continue."}
                </p>
                <Button
                  onClick={handleContinue}
                  disabled={!selectedTemplate}
                  className="shrink-0 rounded-2xl bg-[#035034] text-white shadow-md shadow-[#035034]/20 hover:bg-[#024028] disabled:opacity-50"
                >
                  Continue →
                </Button>
              </div>
            </motion.div>

          ) : (
            /* ── Form step ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="mb-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToPicker}
                  className="text-sm text-muted-foreground underline-offset-2 hover:underline hover:text-[#071a0e]"
                >
                  ← Change template
                </button>
                {selectedTemplate && (
                  <span className="rounded-xl border border-[#e5e0d6] bg-white px-2.5 py-1 text-sm font-medium text-[#071a0e] shadow-sm">
                    {selectedTemplate.emoji} {selectedTemplate.name}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New collection</p>
                <h1 className="mt-1 text-2xl font-bold text-[#071a0e]">Create Project/Event</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fields pre-filled from your template — edit anything before creating.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-[#e5e0d6] bg-white p-6 shadow-sm shadow-[#0a1f12]/4">
                <CollectionForm
                  collection={selectedTemplate?.defaults}
                  onSuccess={handleSuccess}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
