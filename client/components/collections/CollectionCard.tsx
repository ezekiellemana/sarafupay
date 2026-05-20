"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney } from "@/lib/formatters";
import { COLLECTION_TYPE_EMOJIS, COLLECTION_TYPE_LABELS } from "@/lib/collections";
import type { Collection } from "@/types";

export function CollectionCard({ collection }: { collection: Collection }) {
  const progress = collection.targetAmount
    ? Math.min(100, Math.round((collection.totalCollected / collection.targetAmount) * 100))
    : null;

  const copyLink = () => {
    if (collection.publicPaymentLink) {
      navigator.clipboard.writeText(collection.publicPaymentLink);
      toast.success("Payment link copied!");
    } else {
      toast.error("No payment link available for this collection.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="group relative overflow-hidden border border-white/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-shadow hover:shadow-2xl">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-linear-to-r from-[#16a34a] via-[#4ade80] to-[#f59e0b]" />

        <CardContent className="flex flex-col gap-4 p-5">

          {/* Header: emoji + title + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl ring-1 ring-amber-200/60">
                {COLLECTION_TYPE_EMOJIS[collection.collectionType] ?? "💰"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight text-[#071a0e]">
                  {collection.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {COLLECTION_TYPE_LABELS[collection.collectionType] ?? "Custom"}
                </p>
              </div>
            </div>
            <StatusBadge status={collection.status} className="shrink-0" />
          </div>

          {/* Stats: collected + contributors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-2xl bg-green-50 px-3 py-3">
              <p className="text-xs font-medium text-muted-foreground">Collected</p>
              <p className="mt-0.5 truncate text-base font-extrabold text-[#16a34a]">
                {formatMoney(collection.totalCollected, collection.currency)}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-3">
              <p className="text-xs font-medium text-muted-foreground">Contributors</p>
              <p className="mt-0.5 text-base font-extrabold text-amber-700">
                {collection.contributorCount}
              </p>
            </div>
          </div>

          {/* Progress or open-ended indicator */}
          {progress !== null ? (
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">Progress to target</span>
                <span className="font-bold text-[#16a34a]">{progress}%</span>
              </div>
              <AnimatedProgressBar value={progress} variant="gold" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Target: {formatMoney(collection.targetAmount!, collection.currency)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Open-ended · no target set</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 border-t border-slate-100/60 pt-3">
            {/* Copy Link — left */}
            <Button
              size="sm"
              variant="ghost"
              className="h-9 gap-1.5 rounded-xl px-3 text-xs text-muted-foreground hover:bg-green-50 hover:text-[#16a34a]"
              onClick={copyLink}
              disabled={!collection.publicPaymentLink}
            >
              <Copy className="size-3.5" /> Copy Link
            </Button>

            {/* Edit + View — right */}
            <div className="ml-auto flex items-center gap-2">
              <Link href={`/dashboard/collections/${collection._id}/edit`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 gap-1.5 rounded-xl px-3 text-xs text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
              </Link>
              <Link href={`/dashboard/collections/${collection._id}`}>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-[#071a0e] px-4 text-xs font-semibold text-white hover:bg-[#071a0e]/90"
                >
                  <Eye className="size-3.5" /> View
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
