"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Lang } from "@/lib/copy";

/** "SW · EN" switch; keeps the visitor on the same page. */
export function LangSwitch({ lang }: { lang: Lang }) {
  const path = usePathname();
  const sp = useSearchParams();
  const back = encodeURIComponent(path + (sp.toString() ? `?${sp}` : ""));
  return (
    <span className="inline-flex items-center rounded-full border border-line p-0.5 font-mono text-[11px]" aria-label="Language">
      {(["sw", "en"] as Lang[]).map((l) => (
        <a
          key={l}
          href={`/lang?l=${l}&back=${back}`}
          aria-current={l === lang ? "true" : undefined}
          hrefLang={l}
          className={`rounded-full px-2 py-0.5 uppercase transition-colors ${l === lang ? "bg-forest text-paper" : "text-ink-soft hover:text-ink"}`}
        >
          {l}
        </a>
      ))}
    </span>
  );
}
