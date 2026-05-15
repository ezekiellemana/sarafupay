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
    : 0;

  const copyLink = () => {
    if (collection.publicPaymentLink) {
      navigator.clipboard.writeText(collection.publicPaymentLink);
      toast.success("Payment link copied!");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} transition={{ duration: 0.25 }}>
      <Card className="group relative overflow-hidden border border-white/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-shadow hover:shadow-2xl">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-linear-to-r from-[#16a34a] via-[#4ade80] to-[#f59e0b]" />

        <CardContent className="flex flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl ring-1 ring-amber-200/60">
                {COLLECTION_TYPE_EMOJIS[collection.collectionType] ?? "💰"}
              </span>
              <div>
                <p className="font-semibold text-[#071a0e] leading-tight line-clamp-1">{collection.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {COLLECTION_TYPE_LABELS[collection.collectionType] ?? "Custom"}
                </p>
              </div>
            </div>
            <StatusBadge status={collection.status} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-green-50/80 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="mt-0.5 font-bold text-[#16a34a]">{formatMoney(collection.totalCollected, collection.currency)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50/80 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Contributors</p>
              <p className="mt-0.5 font-bold text-amber-700">{collection.contributorCount}</p>
            </div>
          </div>

          {/* Progress */}
          {collection.targetAmount ? (
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-semibold text-[#16a34a]">{progress}%</span>
              </div>
              <AnimatedProgressBar value={progress} variant="gold" />
              <p className="mt-1 text-xs text-muted-foreground">
                Target: {formatMoney(collection.targetAmount, collection.currency)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No target set — open collection</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="ghost" className="h-8 rounded-xl px-3 text-xs text-muted-foreground hover:text-[#16a34a]" onClick={copyLink}>
              <Copy className="mr-1 size-3" /> Copy Link
            </Button>
            <Link href={`/dashboard/collections/${collection._id}`} className="flex-1">
              <Button size="sm" variant="ghost" className="h-8 w-full rounded-xl px-3 text-xs hover:text-[#16a34a]">
                <Eye className="mr-1 size-3" /> View
              </Button>
            </Link>
            <Link href={`/dashboard/collections/${collection._id}?edit=1`}>
              <Button size="sm" variant="ghost" className="h-8 rounded-xl px-3 text-xs hover:text-amber-600">
                <Pencil className="size-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
