"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/types";

export function PaymentLinkCard({ collection }: { collection: Collection }) {
  const [copied, setCopied] = useState(false);
  const link = collection.publicPaymentLink ?? "";

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Payment link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: collection.title, text: `Support: ${collection.title}`, url: link });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="glass-gold rounded-3xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/70">Public Payment Link</p>
      <p className="mt-1 text-xs text-amber-700/60">Share this link with anyone who should contribute.</p>

      <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-2xl border border-amber-200/60 bg-white/70 px-3 py-2.5">
        <ExternalLink className="size-3.5 shrink-0 text-amber-600" />
        <span className="flex-1 truncate text-sm font-medium text-[#071a0e]">{link}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={copyLink}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check className="size-4" /> Copied!
              </motion.span>
            ) : (
              <motion.span key="copy" className="flex items-center gap-2">
                <Copy className="size-4" /> Copy Link
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <Button size="sm" variant="outline" className="h-10 rounded-2xl border-amber-200/60 bg-white/60 px-4" onClick={share}>
          <Share2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
