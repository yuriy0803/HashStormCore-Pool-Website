// lib/api.ts

// ======== Base configuration ========
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
    try { return JSON.parse(text) as T; }
    catch (e) { throw new Error(`Invalid JSON from ${url}: ${String(e)}`); }
  }
  throw new Error(`Expected JSON but got: ${text.slice(0, 80)}... from ${url}`);
}

// ======== Core endpoints ========
const core = {
  listPools: async () => {
    const data = await request<any>("/pools");
    if (Array.isArray(data)) return data;
    if (data?.pools && Array.isArray(data.pools)) return data.pools;
    console.error("Unexpected /pools response:", data);
    return [];
  },

  poolBlocks: (poolId: string, page = 1, pageSize = 20) =>
    request(`/pools/${poolId}/blocks?Page=${page}&PageSize=${pageSize}`),

  poolPayments: (poolId: string, page = 1, pageSize = 20) =>
    request(`/pools/${poolId}/payments?Page=${page}&PageSize=${pageSize}`),

  poolMiners: (poolId: string) => request<any[]>(`/pools/${poolId}/miners`),

  poolPerf: (poolId: string) => request<any[]>(`/pools/${poolId}/performance`),

  minerInPool: (poolId: string, addr: string) =>
    request<any>(`/pools/${poolId}/miners/${addr}`),

  minerPays: (poolId: string, addr: string, page = 1, pageSize = 20) =>
    request(
      `/pools/${poolId}/miners/${addr}/payments?Page=${page}&PageSize=${pageSize}`
    ),

  minerPerf: (poolId: string, addr: string) =>
    request<any[]>(`/pools/${poolId}/miners/${addr}/performance`),
};

// ======== Live endpoints ========
const live = {
  status: () => request<any>("/live/status"),
  poolSnapshot: (poolId: string) => request<any>(`/live/pools/${poolId}/snapshot`),
  poolRound: (poolId: string) => request<any>(`/live/pools/${poolId}/round`),
  poolTopMiners: (poolId: string, windowSec = 600, limit = 50) =>
    request<any>(`/live/pools/${poolId}/top-miners?windowSec=${windowSec}&limit=${limit}`),
  minerSnapshot: (poolId: string, addr: string) =>
    request<any>(`/live/pools/${poolId}/miners/${addr}/snapshot`),
  searchMiners: (q: string, limit = 20) =>
    request<any>(`/live/miners/search?q=${encodeURIComponent(q)}&limit=${limit}`),
};

// ======== API type & export ========
type Api = typeof core & typeof live & {
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
    return pools.find((p: any) => p.id === poolId) || null;
  },

  // aliases expected by pages
  async listPoolMiners(poolId: string) {
    try { return await core.poolMiners(poolId); } catch { return []; }
  },
  async listPoolBlocks(poolId: string, page = 1, pageSize = 20) {
    try { return await core.poolBlocks(poolId, page, pageSize); }
    catch { return { page, pageSize, blocks: [] }; }
  },
  async listPoolPayments(poolId: string, page = 1, pageSize = 20) {
    try { return await core.poolPayments(poolId, page, pageSize); }
    catch { return { page, pageSize, payments: [] }; }
  },
  async getPoolPerformance(poolId: string) {
    try { return await core.poolPerf(poolId); } catch { return []; }
  },
};


// ======== SSE helper ========
export function openEventSource(path: string, onMsg: (data: any) => void) {
  const abs = joinApi(path);
  const es = new EventSource(abs);
  es.onmessage = (ev) => { try { onMsg(JSON.parse(ev.data)); } catch { } };
  return es;
}
