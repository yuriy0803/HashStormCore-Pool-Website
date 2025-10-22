// lib/coins.ts
export function coinIcon(symbol?: string) {
  const key = (symbol || "").toLowerCase();
  return `/coins/${key}.svg`;
}

export function coinKey(symbol?: string) {
  return (symbol || "unknown").toLowerCase();
}
