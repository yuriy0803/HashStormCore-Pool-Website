// lib/coins.ts
export function coinIcon(symbol?: string) {
  const key = (symbol || "").toLowerCase();
  return `/coins/${key}.svg`; // se não existir, o browser falha para 404 (ok)
}

export function coinKey(symbol?: string) {
  return (symbol || "unknown").toLowerCase();
}
