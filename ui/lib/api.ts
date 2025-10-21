import { PoolsResponse, Pool, MinerStats } from "./types";

const BASE = process.env.NEXT_PUBLIC_MININGCORE_API_URL!; // eg: "https://pool.hashstorm.org/api"

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    next: { revalidate: 15 }
  });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  async listPools(): Promise<Pool[]> {
    const data = await j<PoolsResponse>(`${BASE}/pools`);
    return data.pools ?? [];
  },

  //if you have /api/pools/{id} use this; otherwise, filter from the array:
  async getPool(id: string): Promise<Pool> {
    try {
      //try dedicated endpoint (if it exists in your build)
      return await j<Pool>(`${BASE}/pools/${id}`);
    } catch {
      //fallback: loads all and finds
      const all = await api.listPools();
      const found = all.find(p => p.id === id);
      if (!found) throw new Error(`Pool ${id} não encontrada`);
      return found;
    }
  },

  //placeholder: confirm when using the real endpoint
  async getMiner(address: string, poolId: string): Promise<MinerStats> {
    //common examples in Miningcore vary:
    // 1) /miners/{address}?poolId=btcz_pplns
    // 2) /pools/{poolId}/miners/{address}
    //adjust for whatever you have:
    return j<MinerStats>(`${BASE}/miners/${encodeURIComponent(address)}?poolId=${encodeURIComponent(poolId)}`);
  }
};
