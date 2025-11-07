// lib/live.ts
export function getLiveWindowSec(): number {
  const n = Number(process.env.NEXT_PUBLIC_LIVE_WINDOW_SEC);
  // clamp
  if (!Number.isFinite(n) || n <= 0) return 600;
  return Math.max(60, Math.min(3600, Math.floor(n)));
}
