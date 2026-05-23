"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "Create your first collection",
    description: "Start raising money with a unique payment link.",
  },
  {
    label: "Copy your payment link",
    description: "An active collection with a shareable link is ready.",
  },
  {
    label: "Get your first contributor",
    description: "Someone has used your link to contribute.",
  },
  {
    label: "Receive your first payment",
    description: "A completed payment has been recorded.",
  },
];

interface OnboardingChecklistProps {
  hasCollections: boolean;
  hasActiveLink: boolean;
  hasContributors: boolean;
  hasPayments: boolean;
}

export function OnboardingChecklist({
  hasCollections,
  hasActiveLink,
  hasContributors,
  hasPayments,
}: OnboardingChecklistProps) {
  const done = [hasCollections, hasActiveLink, hasContributors, hasPayments];
  const doneCount = done.filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-[#e5e0d6] bg-white p-5 shadow-sm shadow-[#0a1f12]/4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071a0e]">Getting started</p>
          <p className="text-xs text-muted-foreground">
            {doneCount} of {STEPS.length} steps complete
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/60">
          {doneCount}/{STEPS.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => {
          const isDone = done[i] ?? false;
          return (
            <div key={step.label} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  isDone ? "bg-[#16a34a]" : "border-2 border-[#e5e0d6] bg-white",
                )}
              >
                {isDone && <Check className="size-3 text-white" strokeWidth={3} />}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold leading-snug",
                    isDone ? "text-muted-foreground" : "text-[#071a0e]",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
