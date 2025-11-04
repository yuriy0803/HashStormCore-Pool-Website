// ui/lib/format.ts
export function fmtHashrate(v?: number) {
  if (!v) return "0 H/s";
  const u = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s"];
  let i = 0, val = v;
  while (val >= 1000 && i < u.length - 1) { val /= 1000; i++; }
  return `${val.toFixed(2)} ${u[i]}`;
}

export function fmtHashrateUnit(v?: number, unitBase: "H/s" | "Sol/s" = "H/s") {
  if (!v) return `0 ${unitBase}`;
  const prefixes = ["", "k", "M", "G", "T", "P"];
  let i = 0, val = Number(v);
  while (val >= 1000 && i < prefixes.length - 1) { val /= 1000; i++; }
  return `${val.toFixed(2)} ${prefixes[i]}${unitBase}`;
}

export function fmtNum(v?: number, maxFrac = 2) {
  if (v == null) return "-";
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export function fmtISO(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function short(s: string, n = 10) { return s.length > n ? `${s.slice(0, n)}...` : s; }
