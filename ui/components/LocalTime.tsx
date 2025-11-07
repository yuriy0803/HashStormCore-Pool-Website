// ui/components/LocalTime.tsx
"use client";
import * as React from "react";

type Props = {
  iso?: string | number | Date | null;
  className?: string;
  fallback?: React.ReactNode;
  withTime?: boolean; // true → mostra hh:mm:ss; false → só data
};


export default function LocalTime({
  iso,
  className,
  fallback = "-",
  withTime = true,
}: Props) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

 
  let d: Date | null = null;
  if (iso instanceof Date) {
    d = isNaN(iso.getTime()) ? null : iso;
  } else if (typeof iso === "number") {
    const ms = iso > 1e12 ? iso : iso * 1000; // epoch ms vs s
    const tmp = new Date(ms);
    d = isNaN(tmp.getTime()) ? null : tmp;
  } else if (typeof iso === "string") {
    const tmp = new Date(iso);
    d = isNaN(tmp.getTime()) ? null : tmp;
  }

  if (!mounted || !d) return <span className={className}>{fallback}</span>;

  const opts: Intl.DateTimeFormatOptions = withTime
    ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }
    : { year: "numeric", month: "2-digit", day: "2-digit" };

  return (
    <time
      className={className}
      dateTime={d.toISOString()}
      title={d.toISOString()}
      suppressHydrationWarning
    >
      {d.toLocaleString(undefined, opts)}
    </time>
  );
}
