export function LoadingState({
  label,
  variant: _variant,
}: {
  label?: string;
  variant?: "table" | "cards" | "detail";
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3">
      <div className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#035034]" />
      {label && <p className="text-xs font-medium text-slate-400">{label}</p>}
    </div>
  );
}
