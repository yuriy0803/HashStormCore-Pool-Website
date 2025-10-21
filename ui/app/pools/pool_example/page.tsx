import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import Stat from "@/components/Stat";
import { fmtHashrate, fmtNum, fmtISO } from "@/lib/format";

export default async function PoolDetail({ params }: { params: { id: string }}) {
  const pool = await api.getPool(params.id);

  const ports = Object.entries(pool.ports ?? {}).map(([port, cfg]) => ({
    port,
    difficulty: cfg?.difficulty,
    tls: cfg?.tls,
    varDiff: cfg?.varDiff
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {pool.coin?.symbol?.toUpperCase()} • {pool.coin?.name} <span className="text-sub text-sm">({pool.id})</span>
        </h1>
        <div className="text-sub text-sm">
          {pool.paymentProcessing?.payoutScheme} | fee {pool.poolFeePercent}% • min payout {fmtNum(pool.paymentProcessing?.minimumPayment, 8)}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Pool Hashrate" value={fmtHashrate(pool.poolStats?.poolHashrate)} />
        <Stat label="Network Hashrate" value={fmtHashrate(pool.networkStats?.networkHashrate)} />
        <Stat label="Miners" value={pool.poolStats?.connectedMiners ?? 0} />
        <Stat label="Net Difficulty" value={fmtNum(pool.networkStats?.networkDifficulty)} />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Ports</h2>
        <Table>
          <thead>
            <tr>
              <Th>Port</Th>
              <Th>Diff</Th>
              <Th>VarDiff (min–max)</Th>
              <Th>Target</Th>
              <Th>TLS</Th>
              <Th>URL</Th>
            </tr>
          </thead>
          <tbody>
            {ports.map(p => (
              <tr key={p.port}>
                <Td>{p.port}</Td>
                <Td>{p.difficulty ?? "var"}</Td>
                <Td>{p.varDiff ? `${p.varDiff.minDiff}–${p.varDiff.maxDiff}` : "-"}</Td>
                <Td>{p.varDiff ? `${p.varDiff.targetTime}s` : "-"}</Td>
                <Td>{p.tls ? "Yes" : "No"}</Td>
                <Td><code>stratum+{p.tls ? "ssl" : "tcp"}://pool.hashstorm.org:{p.port}</code></Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="text-sub text-sm">
          Last bock: {fmtISO(pool.networkStats?.lastNetworkBlockTime)} | Height: {pool.networkStats?.blockHeight ?? "-"}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Pool</h2>
        <div className="text-sm text-sub">
          Pool url: <a href={pool.addressInfoLink} target="_blank" rel="noreferrer">{pool.address}</a>
        </div>
      </section>
    </div>
  );
}
