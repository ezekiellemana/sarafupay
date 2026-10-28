"use client";

import { useFormStatus } from "react-dom";
import { useFreshOnBack } from "@/components/back-nav";

export function SendButton({ label, busy }: { label: string; busy: string }) {
  useFreshOnBack();
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full justify-center">
      {pending ? busy : label}
    </button>
  );
}
