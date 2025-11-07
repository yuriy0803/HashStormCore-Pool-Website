// ui/lib/liveTicker.ts
// Single, shared ticker for all live widgets (client-only).

let subs = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

// must be NEXT_PUBLIC to be readable on client
const LIVE_MS = Math.max(
  1000,
  Number(process.env.NEXT_PUBLIC_LIVE_REFRESH_MS ?? 15000)
);

function ensureTimer() {
  if (!timer) {
    timer = setInterval(() => {
      subs.forEach(fn => {
        try { fn(); } catch {}
      });
    }, LIVE_MS);
  }
}

export function subscribeLiveTicker(cb: () => void) {
  subs.add(cb);
  ensureTimer();

  return () => {
    subs.delete(cb);
    if (subs.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
