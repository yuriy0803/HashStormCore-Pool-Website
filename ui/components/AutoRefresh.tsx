"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({
  everySec,
  intervalMs,
}: {
  everySec?: number;   // ex: 60
  intervalMs?: number; // ex: 300000
}) {
  const router = useRouter();
  const ms = intervalMs ?? (everySec ? everySec * 1000 : 0);

  useEffect(() => {
    if (!ms || ms <= 0) return;
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [ms, router]);

  return null;
}
