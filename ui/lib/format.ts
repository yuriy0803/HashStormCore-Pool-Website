export function fmtHashrate(v?: number) {
  if (!v) return "0 H/s";
  const u = ["H/s","kH/s","MH/s","GH/s","TH/s","PH/s"];
  let i=0, val=v;
  while (val >= 1000 && i < u.length-1) { val/=1000; i++; }
  return `${val.toFixed(2)} ${u[i]}`;
}
export function fmtNum(v?: number, maxFrac = 2) {
  if (v == null) return "-";
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}
export function fmtISO(iso?: string) { return iso ? new Date(iso).toLocaleString() : "-"; }
export function short(s: string, n=10) { return s.length>n ? `${s.slice(0,n)}…` : s; }
