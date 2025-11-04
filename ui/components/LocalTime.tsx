// ui/components/LocalTime.tsx
"use client";

import React from "react";

type Props = {
  iso?: unknown;           // accepts Date | number | string
  className?: string;
  fallback?: React.ReactNode;
  withTime?: boolean;      //if true shows date+time, if not only date
};

function parseAnyDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v; // epoch s vs ms
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  let s = String(v).trim();
  if (!s) return null;

  // epoch, string
  if (/^\d{10}$/.test(s)) return new Date(Number(s) * 1000);
  if (/^\d{13}$/.test(s)) return new Date(Number(s));

  // "YYYY-MM-DD HH:mm:ss[.frac]" (assumed: UTC)
  const m1 = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
  );
  if (m1) {
    const [, yy, MM, dd, hh, mm, ss, frac = "000"] = m1;
    const ms = Number((frac + "000").slice(0, 3)); // clamp
    const d = new Date(Date.UTC(+yy, +MM - 1, +dd, +hh, +mm, +ss, ms));
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO with fraction >3 digits
  s = s.replace(/(\.\d{3})\d+(Z)?$/, "$1$2");

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export default function LocalTime({
  iso,
  className,
  fallback = "-",
  withTime = true,
}: Props) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const d = parseAnyDate(iso);
  if (!mounted) return <span className={className}>{fallback}</span>;
  if (!d) return <span className={className}>{fallback}</span>;

  const opts: Intl.DateTimeFormatOptions = withTime
    ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }
    : { year: "numeric", month: "2-digit", day: "2-digit" };

  return <time className={className}>{d.toLocaleString(undefined, opts)}</time>;
}
