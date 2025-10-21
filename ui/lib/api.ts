import {
  PoolsResponse, PoolResponse, Pool,
  MinerListItem, MinerDetail, BlockItem, PaymentItem,
  PoolPerfPoint, MinerPerfPoint
} from "./types";

const BASE = process.env.NEXT_PUBLIC_MININGCORE_API_URL!; // ex: http://localhost:4000/api

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, next: { revalidate: 15 } });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  async listPools(): Promise<Pool[]> {
    const data = await j<PoolsResponse>(`${BASE}/pools`);
    return data.pools ?? [];
  },
  async getPool(id: string): Promise<Pool> {
    const data = await j<PoolResponse>(`${BASE}/pools/${id}`);
    return data.pool;
  },
  async listPoolMiners(id: string) {
    return j<MinerListItem[]>(`${BASE}/pools/${id}/miners`);
  },
  async getMinerInPool(id: string, address: string) {
    return j<MinerDetail>(`${BASE}/pools/${id}/miners/${encodeURIComponent(address)}`);
  },
  async listPoolBlocks(id: string) {
    return j<BlockItem[]>(`${BASE}/pools/${id}/blocks`);
  },
  async listPoolPayments(id: string) {
    return j<PaymentItem[]>(`${BASE}/pools/${id}/payments`);
  },
  async getPoolPerformance(id: string) {
    // endpoint returns { stats: PoolPerfPoint[] }
    const data = await j<{ stats: PoolPerfPoint[] }>(`${BASE}/pools/${id}/performance`);
    return data.stats ?? [];
  },
  async getMinerPerformance(id: string, address: string) {
    return j<MinerPerfPoint[]>(`${BASE}/pools/${id}/miners/${encodeURIComponent(address)}/performance`);
  },
};
