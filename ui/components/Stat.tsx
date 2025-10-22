// ui/components/Stat.tsx

import { ReactNode } from "react";

export default function Stat({
  label, value, hint
}: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-card border border-edge p-4">
      <div className="text-sub text-sm">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-sub text-xs mt-1">{hint}</div>}
    </div>
  );
}
