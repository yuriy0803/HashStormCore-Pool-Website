// ui/components/Table.tsx

import { ReactNode } from "react";
import clsx from "clsx";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-2xl bg-card border border-edge overflow-hidden", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={clsx("text-left px-4 py-3 bg-edge text-sub", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={clsx("px-4 py-3 border-t border-edge", className)}>{children}</td>;
}
