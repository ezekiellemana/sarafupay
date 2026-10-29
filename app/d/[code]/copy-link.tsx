"use client";

import { useState } from "react";

/** Copies the public collection link so the organiser can paste it into the WhatsApp group. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt("Copy this link", url);
        }
      }}
      aria-label="Copy the public link"
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-medium transition-colors hover:border-forest sm:px-4"
    >
      <span aria-hidden>{done ? "✓" : "🔗"}</span>
      <span className="hidden sm:inline">{done ? "Copied" : "Copy link"}</span>
    </button>
  );
}
