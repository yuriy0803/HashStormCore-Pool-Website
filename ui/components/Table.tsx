// ui/components/Table.tsx

import { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-edge overflow-hidden">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
export function Th({ children }: { children: ReactNode }) {
  return <th className="text-left px-4 py-3 bg-edge text-sub">{children}</th>;
}
export function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 border-t border-edge">{children}</td>;
}
