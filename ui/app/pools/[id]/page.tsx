import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import Stat from "@/components/Stat";
import ChartArea from "@/components/ChartArea";
import Link from "next/link";
import { fmtHashrate, fmtNum, fmtISO, short } from "@/lib/format";


// ui/pools/[id]/page.tsx
export default async function PoolDetail({ params }: { params: { id: string } }) {
  const pool = await api.getPool(params.id);
  const perf = await api.getPoolPerformance(params.id); // PoolPerfPoint[]

  const ports = Object.entries(pool.ports ?? {}).map(([port, cfg]) => ({
    port, difficulty: cfg?.difficulty, tls: cfg?.tls, varDiff: cfg?.varDiff
  }));

  const perfData = perf.map(p => ({
    t: new Date(p.created).toLocaleTimeString(),
    poolHashrate: p.poolHashrate,
    connectedMiners: p.connectedMiners,
    networkHashrate: p.networkHashrate,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {pool.coin.symbol.toUpperCase()} • {pool.coin.name} <span className="text-sub text-sm">({pool.id})</span>
        </h1>
        <div className="text-sub text-sm">
          {pool.paymentProcessing.payoutScheme} | fee {pool.poolFeePercent}% | min {fmtNum(pool.paymentProcessing.minimumPayment, 8)}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Pool Hashrate" value={fmtHashrate(pool.poolStats.poolHashrate)} />
        <Stat label="Network Hashrate" value={fmtHashrate(pool.networkStats.networkHashrate)} />
        <Stat label="Miners" value={pool.poolStats.connectedMiners} />
        <Stat label="Net Difficulty" value={fmtNum(pool.networkStats.networkDifficulty)} />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Performance (last hours)</h2>
        <ChartArea data={perfData} xKey="t" yKey="poolHashrate" yFormat="hashrate" />
      </section>

      {pool.topMiners && pool.topMiners.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Top miners</h2>
          {/*
            For non SOLO pools, fetch pending shares
            (Small list -> paralel fetch OK)
          */}
          {async function TopMinersTable() {
            const isSolo = (pool.paymentProcessing?.payoutScheme || "").toUpperCase() === "SOLO";
            const rows = isSolo
              ? pool.topMiners!.map(m => ({ ...m, pendingShares: undefined }))
              : await Promise.all(
                pool.topMiners!.map(async (m) => {
                  try {
                    const d = await api.getMinerInPool(pool.id, m.miner);
                    return { ...m, pendingShares: d.pendingShares };
                  } catch {
                    return { ...m, pendingShares: undefined };
                  }
                })
              );

            return (
              <Table>
                <thead>
                  <tr>
                    <Th>Miner</Th>
                    <Th>Hashrate</Th>
                    <Th>Shares/s</Th>
                    {!isSolo && <Th>Pending shares</Th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.miner}>
                      <Td>
                        <Link className="underline" href={`/pools/${pool.id}/miners/${m.miner}`}>
                          {m.miner}
                        </Link>
                      </Td>
                      <Td>{fmtHashrate(m.hashrate)}</Td>
                      <Td>{fmtNum(m.sharesPerSecond, 4)}</Td>
                      {!isSolo && <Td>{m.pendingShares != null ? fmtNum(m.pendingShares, 4) : "—"}</Td>}
                    </tr>
                  ))}
                </tbody>
              </Table>
            );
          }()}
          <div className="text-sm text-sub">
            All: <Link className="underline" href={`/pools/${pool.id}/miners`}>/miners</Link> •
            Blocks: <Link className="underline" href={`/pools/${pool.id}/blocks`}>/blocks</Link> •
            Payments: <Link className="underline" href={`/pools/${pool.id}/payments`}>/payments</Link>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">Ports</h2>
        <Table>
          <thead>
            <tr><Th>Port</Th><Th>Diff</Th><Th>VarDiff (min - max)</Th><Th>Target</Th><Th>TLS</Th><Th>URL</Th></tr>
          </thead>
          <tbody>
            {ports.map(p => (
              <tr key={p.port}>
                <Td>{p.port}</Td>
                <Td>{p.difficulty ?? "var"}</Td>
                <Td>{p.varDiff ? `${p.varDiff.minDiff} - ${p.varDiff.maxDiff}` : "-"}</Td>
                <Td>{p.varDiff ? `${p.varDiff.targetTime}s` : "-"}</Td>
                <Td>{p.tls ? "Yes" : "No"}</Td>
                <Td>
                  <code>
                    stratum+{p.tls ? "ssl" : "tcp"}://{pool.coin?.symbol?.toLowerCase()}.hashstorm.org:{p.port}
                  </code>
                </Td>

              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Pool</h2>
        <div className="text-sm text-sub">
          Pool Address: <a className="underline" href={pool.addressInfoLink} target="_blank" rel="noreferrer">{pool.address}</a> •
          Last block from chain: {fmtISO(pool.networkStats.lastNetworkBlockTime)} (#{pool.networkStats.blockHeight ?? "-"})
        </div>
        <div className="text-sm text-sub">
          Comunity: <a className="underline" href={pool.coin.discord} target="_blank">Discord</a> • <a className="underline" href={pool.coin.telegram} target="_blank">Telegram</a> • <a className="underline" href={pool.coin.twitter} target="_blank">Twitter (X)</a>
        </div>
      </section>
    </div>
  );
}
