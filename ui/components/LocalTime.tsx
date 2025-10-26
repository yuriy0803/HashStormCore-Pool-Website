"use client";

import { useEffect, useState } from "react";

type Props = {
  iso: string | number | Date | null | undefined;
  withSeconds?: boolean;
  dateStyle?: "short" | "medium" | "long";
  timeStyle?: "short" | "medium" | "long";
  className?: string;
  fallback?: string; // shown on SSR / before assembling
};

/** Displays LOCAL date/time without causing hydration mismatch. */
export default function LocalTime({
  iso,
  withSeconds = true,
  dateStyle = "medium",
  timeStyle = "medium",
  className,
  fallback = "",
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!iso) return <span className={className}>—</span>;

  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { dateStyle, timeStyle };
  if (!withSeconds) opts.second = undefined;

  const text = mounted ? d.toLocaleString(undefined, opts) : fallback;

  return <span className={className} suppressHydrationWarning>{text}</span>;
}
