// ui/components/Table.tsx
import { ReactNode, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import clsx from "clsx";

export function Table({ children, className, ...rest }: TableHTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <div className={clsx("rounded-2xl bg-card border border-edge overflow-hidden", className)}>
      <table className="w-full text-sm" {...rest}>{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      {...rest}
      className={clsx("text-left px-4 py-3 bg-edge text-sub", className)}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td
      {...rest}
      className={clsx("px-4 py-3 border-t border-edge", className)}
    >
      {children}
    </td>
  );
}
