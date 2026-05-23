"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/types";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function QrDialog({ link, slug, title }: { link: string; slug: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, link, { width: 200, margin: 1, color: { dark: "#071a0e", light: "#ffffff" } });
    }
  }, [link]);

  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug ?? "payment"}-qr.png`;
    a.click();
  };

  return (
    <DialogContent className="max-w-xs rounded-3xl text-center">
      <DialogHeader>
        <DialogTitle className="text-[#071a0e]">{title}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-xs text-muted-foreground">Scan to open the payment page</p>
        <Button size="sm" className="w-full rounded-2xl bg-[#071a0e] text-white hover:bg-[#0f2e18]" onClick={downloadQr}>
          Download QR Image
        </Button>
      </div>
    </DialogContent>
  );
}

export function PaymentLinkCard({ collection }: { collection: Collection }) {
  const [copied, setCopied] = useState(false);
  const link = collection.publicPaymentLink ?? "";

  const copyLink = () => {
    if (!link) { toast.error("Payment link is not available for this collection."); return; }
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Payment link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!link) { toast.error("Payment link is not available for this collection."); return; }
    const text = encodeURIComponent(`${collection.title}\n\nPay here: ${link}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-[#fffbf0] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/70">Public Payment Link</p>
      <p className="mt-1 text-xs text-amber-700/60">Share this link with anyone who should contribute.</p>

      <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-xl border border-amber-200 bg-white px-3 py-2.5">
        <ExternalLink className="size-3.5 shrink-0 text-amber-600" />
        <span className="flex-1 truncate text-sm font-medium text-[#071a0e]">{link}</span>
      </div>

      {/* Copy link — primary action */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={copyLink}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600"
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

      {/* Secondary actions */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-10 rounded-2xl border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
          onClick={shareWhatsApp}
        >
          <WhatsAppIcon />
          <span className="ml-1.5">WhatsApp</span>
        </Button>

        {link && (
          <Dialog>
            <DialogTrigger className="flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-amber-200 bg-white px-3 text-sm font-medium text-[#071a0e] hover:bg-amber-50">
              <QrCode className="size-4" />
              QR Code
            </DialogTrigger>
            <QrDialog link={link} slug={collection.slug ?? "payment"} title={collection.title} />
          </Dialog>
        )}
      </div>
    </div>
  );
}
