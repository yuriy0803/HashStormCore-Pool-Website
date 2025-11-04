// ui/lib/api.ts

// ======== Base configuration ========
const BASE = "/api";

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

// ======== Request helper ========
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

// Small util: normalize date to ISO (JS Date only supports up to 3 frac digits)
export function toIso(s0?: string | number) {
  if (s0 == null) return undefined;

  if (typeof s0 === "number") {
    const d = new Date(s0 > 1e12 ? s0 : s0 * 1000);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  let s = String(s0).trim();

  // eg. "2025-11-03T19:20:19.011264Z" -> "2025-11-03T19:20:19.011Z"
  s = s.replace(/\.(\d{3})\d+(?=(Z|[+-]\d{2}:?\d{2})$)/, '.$1');

  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}


// --- helper for SLug of LIVE endpoints ---
const normPoolId = (s: string) => encodeURIComponent(String(s).replace(/[\s-]+/g, "_").toLowerCase());


// ======== Core endpoints ========
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
    // try first LIVE (has created ISO guaranteed)
    try {
      const pidLive = normPoolId(poolId);
      const arr = await request<any[]>(`/live/pools/${pidLive}/blocks?PageSize=10000`);
      const blocksRaw = Array.isArray(arr) ? arr : [];

      const blocks = blocksRaw.map((b) => ({
        ...b,
        // preserves ISO that already comes from live; fallback if missing
        created: typeof b.created === "string" && b.created
          ? b.created
          : toIso(b.createdAt ?? b.creationTime ?? b.timestamp ?? b.time) ?? undefined,
      }));

      const start = Math.max(0, (page - 1) * pageSize);
      return { page, pageSize, blocks: blocks.slice(start, start + pageSize), total: blocks.length };
    } catch {
      // fallback to /pools classic in case /live fails
      const pid = encodeURIComponent(poolId);
      const arr = await request<any[]>(`/pools/${pid}/blocks`);
      const blocksRaw = Array.isArray(arr) ? arr : [];
      const blocks = blocksRaw.map((b) => ({
        ...b,
        created: toIso(b.created ?? b.createdAt ?? b.creationTime ?? b.timestamp ?? b.time) ?? undefined,
      }));
      const start = Math.max(0, (page - 1) * pageSize);
      return { page, pageSize, blocks: blocks.slice(start, start + pageSize), total: blocks.length };
    }
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

  // /performance -> { stats: [...] }
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

// ======== Live endpoints ========
const live = {
  status: () => request<any>("/live/status"),
  poolSnapshot: (poolId: string) =>
    request<any>(`/live/pools/${normPoolId(poolId)}/snapshot`),
  poolRound: (poolId: string) =>
    request<any>(`/live/pools/${normPoolId(poolId)}/round`),
  poolTopMiners: (poolId: string, windowSec = 600, limit = 50) =>
    request<any>(`/live/pools/${normPoolId(poolId)}/top-miners?windowSec=${windowSec}&limit=${limit}`),
  minerSnapshot: (poolId: string, addr: string) =>
    request<any>(`/live/pools/${normPoolId(poolId)}/miners/${encodeURIComponent(addr)}/snapshot`),
  searchMiners: (q: string, limit = 20) =>
    request<any>(`/live/miners/search?q=${encodeURIComponent(q)}&limit=${limit}`),
};

// ======== API type & export ========
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

// ======== SSE helper ========
export function openEventSource(path: string, onMsg: (data: any) => void) {
  const abs = joinApi(path);
  const es = new EventSource(abs);
  es.onmessage = (ev) => {
    try { onMsg(JSON.parse(ev.data)); } catch { /* ignore */ }
  };
  return es;
}
