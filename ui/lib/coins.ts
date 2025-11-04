// Fallback query version (served by an optional route handler)
export function coinIcon(symbol?: string) {
  const key = (symbol ?? "").toLowerCase();
  return `/api/coin-icon?key=${encodeURIComponent(key)}`;
}
