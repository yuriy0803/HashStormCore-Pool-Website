// ui/app/pools/[id]/page.tsx
import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import Stat from "@/components/Stat";
import Link from "next/link";
import { fmtHashrate, fmtNum, fmtISO } from "@/lib/format";
import { tServer } from "@/i18n/server";
import ChartArea from "@/components/ChartArea";
import AutoRefresh from "@/components/AutoRefresh";

import Image from "next/image";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function PoolDetail({ params }: { params: { id: string } }) {
  const tStat = tServer("Stat");
  const tPool = tServer("Pool");

  const pool = await api.getPool(params.id);
  const perf = await api.getPoolPerformance(params.id);

  const perfData = (Array.isArray(perf) ? perf : []).map((p: any) => ({
    t: new Date(p.created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    poolHashrate: Number(p.poolHashrate ?? 0),
  }));


  const ports = Object.entries(pool.ports ?? {}).map(([port, cfg]) => ({
    port, difficulty: cfg?.difficulty, tls: cfg?.tls, varDiff: cfg?.varDiff
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          <Image src={`/coins/${pool.coin.name}.svg`} alt={pool.coin.symbol} width={36} height={36} />
          {pool.id.replaceAll("_", " ").toUpperCase()}
        </h1>
        <div className="text-sub text-sm">
          {tPool("metaRight", {
            scheme: pool.paymentProcessing.payoutScheme,
            fee: pool.poolFeePercent,
            min: fmtNum(pool.paymentProcessing.minimumPayment, 8)
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label={tStat("poolHashrate")} value={fmtHashrate(pool.poolStats.poolHashrate)} />
        <Stat label={tStat("networkHashrate")} value={fmtHashrate(pool.networkStats.networkHashrate)} />
        <Stat label={tStat("miners")} value={pool.poolStats.connectedMiners} />
        <Stat label={tStat("netDifficulty")} value={fmtNum(pool.networkStats.networkDifficulty)} />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">{tPool("performanceTitle")}</h2>

        <ChartArea data={perfData} xKey="t" yKey="poolHashrate" yFormat="hashrate" />
        {/* auto-refresh each 5 min*/}
        <AutoRefresh intervalMs={300_000} />
      </section>

      {pool.topMiners && pool.topMiners.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">{tPool("topMiners")}</h2>
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
                    <Th>{tPool("table.miner")}</Th>
                    <Th>{tPool("table.hashrate")}</Th>
                    <Th>{tPool("table.sharesS")}</Th>
                    {!isSolo && <Th>{tPool("table.pendingShares")}</Th>}
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
            {tPool("links.all")}: <Link className="underline" href={`/pools/${pool.id}/miners`}>{tPool("links.miners")}</Link> •
            {tPool("links.blocks")}: <Link className="underline" href={`/pools/${pool.id}/blocks`}>{tPool("links.blocks")}</Link> •
            {tPool("links.payments")}: <Link className="underline" href={`/pools/${pool.id}/payments`}>{tPool("links.payments")}</Link>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">{tPool("sections.ports")}</h2>
        <Table>
          <thead>
            <tr>
              <Th>{tPool("table.port")}</Th>
              <Th>{tPool("table.diff")}</Th>
              <Th>{tPool("table.vardiff")}</Th>
              <Th>{tPool("table.target")}</Th>
              <Th>{tPool("table.tls")}</Th>
              <Th>{tPool("table.url")}</Th>
            </tr>
          </thead>
          <tbody>
            {ports.map(p => (
              <tr key={p.port}>
                <Td>{p.port}</Td>
                <Td>{p.difficulty ?? "var"}</Td>
                <Td>{p.varDiff ? `${p.varDiff.minDiff} - ${p.varDiff.maxDiff}` : "-"}</Td>
                <Td>{p.varDiff ? `${p.varDiff.targetTime}s` : "-"}</Td>
                <Td>{p.tls ? tServer("Common")("yes") : tServer("Common")("no")}</Td>
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
        <h2 className="font-semibold">{tPool("sections.pool")}</h2>
        <div className="text-sm text-sub">
          Pool Address: <a className="underline" href={pool.addressInfoLink} target="_blank" rel="noreferrer">{pool.address}</a> •{" "}
          Last block from chain: {fmtISO(pool.networkStats.lastNetworkBlockTime)} (#{pool.networkStats.blockHeight ?? "-"})
        </div>
        <div className="text-sm text-sub">
          {tPool("sections.community")}: <a className="underline" href={pool.coin.discord} target="_blank">Discord</a> •{" "}
          <a className="underline" href={pool.coin.telegram} target="_blank">Telegram</a> •{" "}
          <a className="underline" href={pool.coin.twitter} target="_blank">Twitter (X)</a>
        </div>
      </section>
    </div>
  );
}
