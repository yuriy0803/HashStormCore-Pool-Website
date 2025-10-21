"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";

function fmtCoin(v?: number) {
  if (v == null) return "-";
  return v.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export default function MinerPage() {
  const [addr, setAddr] = useState("");
  const [pool, setPool] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSearch = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await api.getMiner(addr.trim(), pool || undefined);
      setData(res);
    } catch (e: any) {
      setErr(e.message || "Erro");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Miner Lookup</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="rounded-xl bg-card border border-edge px-3 py-2"
               placeholder="Wallet address (t1.., zs.., etc.)"
               value={addr} onChange={e=>setAddr(e.target.value)} />
        <input className="rounded-xl bg-card border border-edge px-3 py-2"
               placeholder="Pool ID (opcional, ex: btcz_solo)"
               value={pool} onChange={e=>setPool(e.target.value)} />
        <button onClick={onSearch}
                disabled={!addr || loading}
                className="rounded-xl bg-accent/20 border border-accent/40 px-4 py-2 hover:bg-accent/30 disabled:opacity-50">
          {loading ? "A procurar..." : "Procurar"}
        </button>
      </div>

      {err && <div className="text-red-400">{err}</div>}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-2xl bg-card border border-edge p-4">
              <div className="text-sub text-sm">Address</div>
              <div className="text-sm break-all mt-1">{data.address}</div>
            </div>
            <div className="rounded-2xl bg-card border border-edge p-4">
              <div className="text-sub text-sm">Pool</div>
              <div className="text-lg font-semibold mt-1">{data.poolId ?? "-"}</div>
            </div>
            <div className="rounded-2xl bg-card border border-edge p-4">
              <div className="text-sub text-sm">Hashrate</div>
              <div className="text-lg font-semibold mt-1">
                {data.hashrate ? `${(data.hashrate/1e6).toFixed(2)} MH/s` : "-"}
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-edge p-4">
              <div className="text-sub text-sm">Pending</div>
              <div className="text-lg font-semibold mt-1">{fmtCoin(data.pendingBalance)} </div>
            </div>
          </div>

          {Array.isArray(data.payments) && data.payments.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold">Payments</h2>
              <Table>
                <thead>
                  <tr><Th>TX</Th><Th>Amount</Th><Th>Data</Th></tr>
                </thead>
                <tbody>
                  {data.payments.map((p:any)=>(
                    <tr key={p.txId}>
                      <Td><code className="text-xs">{p.txId.slice(0,18)}…</code></Td>
                      <Td>{fmtCoin(p.amount)}</Td>
                      <Td>{new Date(p.created).toLocaleString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
