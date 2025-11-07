// ui/lib/api.ts
import { getLiveWindowSec } from "@/lib/live";

/* ===================== Base configuration ===================== */
const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_MININGCORE_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "/api";

const SELF_ORIGIN =
  process.env.INTERNAL_SELF_ORIGIN ||
  "http://localhost:3000";

// Build a clean absolute API URL (SSR + browser)
function joinApi(path: string) {
  const base = PUBLIC_BASE.replace(/\/+$/, "");
  const tail = path.startsWith("/") ? path : `/${path}`;
  const joined =
    base.endsWith("/api") && tail.startsWith("/api")
      ? base + tail.replace(/^\/api/, "")
      : base + tail;

  if (/^https?:\/\//i.test(joined)) return joined;
  return new URL(joined, SELF_ORIGIN).toString();
}

/* ===================== Request helper ===================== */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = joinApi(path);
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} @ ${url}`);

  const text = await res.text();
  const ct = (res.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json") || /^[\[{]/.test(text.trim())) {
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      throw new Error(`Invalid JSON from ${url}: ${String(e)}`);
    }
  }
  throw new Error(`Expected JSON but got: ${text.slice(0, 80)}... from ${url}`);
}

/* ===================== Small utils ===================== */
export function toIso(s?: string | number) {
  if (s == null) return undefined;
  if (typeof s === "number") return new Date(s > 1e12 ? s : s * 1000).toISOString();
  const t = String(s).trim().replace(/\.(\d{3})\d+(?=(Z|[+-]\d{2}:?\d{2})$)/, ".$1");
  const d = new Date(t);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function fmtIsoToLocal(iso?: string | number | Date | null, withTime = true): string {
  if (iso == null) return "-";
  const d =
    iso instanceof Date ? iso :
    typeof iso === "number" ? new Date(iso > 1e12 ? iso : iso * 1000) :
    new Date(String(iso));

  if (isNaN(d.getTime())) return "-";

  const pad = (n: number) => String(n).padStart(2, "0");
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());

  if (!withTime) return `${Y}-${M}-${D}`;

  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

// --- helper para slug normalizado das LIVE endpoints ---
const normPoolId = (s: string) => String(s).replace(/[\s-]+/g, "_").toLowerCase();

/* ===================== Core endpoints (persistentes/DB) ===================== */
const core = {
  listPools: async () => {
    const data = await request<any>("/pools");
    if (Array.isArray(data)) return data;
    if (data?.pools && Array.isArray(data.pools)) return data.pools;
    console.error("Unexpected /pools response:", data);
    return [];
  },

  // /blocks returns simple ARRAY
  poolBlocks: async (poolId: string, page = 1, pageSize = 20) => {
    const pid = encodeURIComponent(poolId);
    const arr = await request<any[]>(`/pools/${pid}/blocks?PageSize=1000`);
    const blocksRaw = Array.isArray(arr) ? arr : [];
    const blocks = blocksRaw.map((b) => ({
      ...b,
      created: toIso(b.created ?? b.createdAt ?? b.creationTime ?? b.timestamp ?? b.time) ?? undefined,
    }));
    const start = Math.max(0, (page - 1) * pageSize);
    return { page, pageSize, blocks: blocks.slice(start, start + pageSize), total: blocks.length };
  },

  poolPayments: async (poolId: string, page = 1, pageSize = 20) => {
    const pid = encodeURIComponent(poolId);
    const arr = await request<any[]>(`/pools/${pid}/payments`);
    const payments = Array.isArray(arr) ? arr : [];
    const start = Math.max(0, (page - 1) * pageSize);
    return { page, pageSize, payments: payments.slice(start, start + pageSize), total: payments.length };
  },

  poolMiners: (poolId: string) => {
    const pid = encodeURIComponent(poolId);
    return request<any[]>(`/pools/${pid}/miners`);
  },

  // /performance -> { stats: [...] } (ou array simples)
  poolPerf: async (poolId: string) => {
    const pid = encodeURIComponent(poolId);
    const data = await request<any>(`/pools/${pid}/performance`);
    const stats = Array.isArray(data) ? data : Array.isArray(data?.stats) ? data.stats : [];
    return stats;
  },

  minerInPool: (poolId: string, addr: string) => {
    const pid = encodeURIComponent(poolId);
    const a = encodeURIComponent(addr);
    return request<any>(`/pools/${pid}/miners/${a}`);
  },

  minerPays: (poolId: string, addr: string, page = 1, pageSize = 20) => {
    const pid = encodeURIComponent(poolId);
    const a = encodeURIComponent(addr);
    return request<any>(`/pools/${pid}/miners/${a}/payments?Page=${page}&PageSize=${pageSize}`);
  },

  minerPerf: (poolId: string, addr: string) => {
    const pid = encodeURIComponent(poolId);
    const a = encodeURIComponent(addr);
    return request<any[]>(`/pools/${pid}/miners/${a}/performance`);
  },
};

/* ===================== Live endpoints (voláteis/SSE-friendly) ===================== */
const live = {
  // usa a janela do .env por omissão
  status: (windowSec?: number) => {
    const ws = windowSec ?? getLiveWindowSec();
    return request<any>(`/live/status?windowSec=${ws}`);
  },

  poolSnapshot: (poolId: string, windowSec?: number) => {
    const ws = windowSec ?? getLiveWindowSec();
    return request<any>(`/live/pools/${encodeURIComponent(normPoolId(poolId))}/snapshot?windowSec=${ws}`);
  },

  poolRound: (poolId: string) =>
    request<any>(`/live/pools/${encodeURIComponent(normPoolId(poolId))}/round`),

  poolTopMiners: (poolId: string, windowSec?: number, limit = 50) => {
    const ws = windowSec ?? getLiveWindowSec();
    return request<any>(`/live/pools/${encodeURIComponent(normPoolId(poolId))}/top-miners?windowSec=${ws}&limit=${limit}`);
  },

  minerSnapshot: (poolId: string, addr: string, windowSec?: number) => {
    const ws = windowSec ?? getLiveWindowSec();
    return request<any>(`/live/pools/${encodeURIComponent(normPoolId(poolId))}/miners/${encodeURIComponent(addr)}/snapshot?windowSec=${ws}`);
  },

  searchMiners: (q: string, limit = 20) =>
    request<any>(`/live/miners/search?q=${encodeURIComponent(q)}&limit=${limit}`),
};

/* ===================== API type & export ===================== */
type Api = typeof core &
  typeof live & {
    getPool(poolId: string): Promise<any | null>;
    listPoolMiners(poolId: string): Promise<any[]>;
    listPoolBlocks(poolId: string, page?: number, pageSize?: number): Promise<any>;
    listPoolPayments(poolId: string, page?: number, pageSize?: number): Promise<any>;
    getPoolPerformance(poolId: string): Promise<any[]>;
  };

export const api: Api = {
  ...core,
  ...live,

  async getPool(poolId: string) {
    const pools = await core.listPools();

    // exact match first
    let m = pools.find((p: any) => p.id === poolId);
    if (m) return m;

    // robust match (capital ignores, spaces, hyphens)
    const norm = (s: string) => String(s).replace(/[\s-]+/g, "_").toLowerCase();
    const want = norm(poolId);

    m = pools.find((p: any) => norm(p.id) === want);
    return m || null;
  },

  async listPoolMiners(poolId: string) {
    try { return await core.poolMiners(poolId); } catch { return []; }
  },

  async listPoolBlocks(poolId: string, page = 1, pageSize = 20) {
    try { return await core.poolBlocks(poolId, page, pageSize); }
    catch { return { page, pageSize, blocks: [], total: 0 }; }
  },

  async listPoolPayments(poolId: string, page = 1, pageSize = 20) {
    try { return await core.poolPayments(poolId, page, pageSize); }
    catch { return { page, pageSize, payments: [], total: 0 }; }
  },

  async getPoolPerformance(poolId: string) {
    try {
      const raw = await core.poolPerf(poolId);
      const stats: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.stats)
          ? (raw as any).stats
          : [];

      return stats.map((p: any) => ({
        ...p,
        created: (p.created && String(p.created)) ||
                 (p.time && String(p.time)) ||
                 (p.timestamp && String(p.timestamp)) ||
                 undefined,
        poolHashrate: Number(p.poolHashrate ?? 0),
        connectedMiners: Number(p.connectedMiners ?? 0),
      }));
    } catch {
      return [];
    }
  },
};

/* ===================== SSE helper ===================== */
export function openEventSource(path: string, onMsg: (data: any) => void) {
  const abs = joinApi(path);
  const es = new EventSource(abs);
  es.onmessage = (ev) => {
    try { onMsg(JSON.parse(ev.data)); } catch { /* ignore */ }
  };
  return es;
}

/* ===================== Public constant (optional) ===================== */
export const LIVE_WINDOW_SEC =
  Number(process.env.NEXT_PUBLIC_LIVE_WINDOW_SEC ?? "600");
