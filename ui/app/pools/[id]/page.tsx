// ui/app/pools/[id]/page.tsx
import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import Stat from "@/components/Stat";
import Link from "next/link";
import { fmtHashrate, fmtNum } from "@/lib/format";
import { tServer } from "@/i18n/server";
import ChartArea from "@/components/ChartArea";
import AutoRefresh from "@/components/AutoRefresh";
import Image from "next/image";
import LocalTime from "@/components/LocalTime";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type SearchParams = { [k: string]: string | string[] | undefined };

const PAGE_SIZE = 10;

function intParam(v: string | string[] | undefined, fallback = 1) {
  const n = Array.isArray(v) ? v[0] : v;
  const x = Number.parseInt(String(n ?? "")) || fallback;
  return Math.max(1, x);
}

export default async function PoolDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const tStat = tServer("Stat");
  const tPool = tServer("Pool");

  // 1) pool + performance
  const pool = await api.getPool(params.id);
  if (!pool) {
    return <div className="text-[var(--muted)]">Pool not found.</div>;
  }
  const perf = await api.getPoolPerformance(pool.id);

  const ports = Object.entries(pool.ports ?? {}).map(([port, cfg]) => ({
    port,
    difficulty: (cfg as any)?.difficulty,
    tls: (cfg as any)?.tls,
    varDiff: (cfg as any)?.varDiff,
  }));

  // ---- pagination state
  const minersPage = intParam(searchParams?.minersPage, 1);
  const blocksPage = intParam(searchParams?.blocksPage, 1);

  // ---- miners (24h top) - mem paging
  const minersAll = await api.listPoolMiners(pool.id);
  const minersTotal = minersAll.length;
  const minersStart = (minersPage - 1) * PAGE_SIZE;
  const miners = minersAll.slice(minersStart, minersStart + PAGE_SIZE);
  const minersHasNext = minersStart + PAGE_SIZE < minersTotal;

  // ---- blocks (uses endpoint pagination)
  const blocksResp = await api.listPoolBlocks(pool.id, blocksPage, PAGE_SIZE);
  const blocks = Array.isArray(blocksResp?.blocks) ? blocksResp.blocks : [];

  const blocksHasNext = blocks.length === PAGE_SIZE;

  const isSolo =
    (pool.paymentProcessing?.payoutScheme || "").toUpperCase() === "SOLO";

  // helper build links
  const qp = (sp: SearchParams, patch: Record<string, string | number>) => ({
    pathname: `/pools/${pool.id}`,
    query: { ...sp, ...patch },
  });

  // normalize blocks to render
  const nBlocks = blocks.map((b: any) => ({
    height: b.blockHeight ?? b.blockheight ?? b.height ?? null,
    hash: b.transactionConfirmationData ?? b.blockHash ?? b.hash ?? null,
    created: b.created ?? b.creationTime ?? b.timestamp ?? null,
    status:
      b.status ??
      (b.confirmed === true
        ? "confirmed"
        : b.confirmed === false
        ? "pending"
        : undefined),
    amount: b.amount ?? b.reward ?? b.value ?? undefined,
    miner: b.miner ?? b.address ?? undefined,
    efficiency: b.efficiency ?? b.effort ?? undefined,
  }));

  // perf data -> ChartArea
  const perfData = (Array.isArray(perf) ? perf : []).map((p: any) => ({
    t: p.created,
    poolHashrate: Number(p.poolHashrate ?? 0),
    connectedMiners: Number(p.connectedMiners ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          {pool.coin?.name && (
            <Image
              src={`/coins/${String(pool.coin.name).toLowerCase()}.png`}
              alt={pool.coin.symbol ?? ""}
              width={36}
              height={36}
            />
          )}
          {pool.id.replaceAll("_", " ").toUpperCase()}
        </h1>
        <div className="text-sub text-sm">
          {tPool("metaRight", {
            scheme: pool.paymentProcessing?.payoutScheme,
            fee: pool.poolFeePercent,
            min: fmtNum(pool.paymentProcessing?.minimumPayment, 8),
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat
          label={tStat("poolHashrate")}
          value={fmtHashrate(pool.poolStats?.poolHashrate)}
        />
        <Stat
          label={tStat("networkHashrate")}
          value={fmtHashrate(pool.networkStats?.networkHashrate)}
        />
        <Stat
          label={tStat("miners")}
          value={fmtNum(pool.poolStats?.connectedMiners)}
        />
        <Stat
          label={tStat("netDifficulty")}
          value={fmtNum(pool.networkStats?.networkDifficulty)}
        />
      </div>

      {/* How to connect */}
      <section>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="font-semibold mb-2">How to connect</h3>
          <p className="text-sm text-sub mb-3">
            Use your <b>wallet address</b> as username and any password (e.g.{" "}
            <code>x</code>). Choose one of the endpoints:
          </p>
          <ul className="text-sm space-y-1">
            {ports.map((p) => (
              <li key={p.port}>
                <code>
                  stratum+{p.tls ? "ssl" : "tcp"}://
                  {pool.coin?.symbol?.toLowerCase()}.hashstorm.org:{p.port}
                </code>{" "}
                | Minimum Payout {fmtNum(pool.paymentProcessing?.minimumPayment)}{" "}
                {pool.coin?.symbol}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Performance */}
      <section className="space-y-3">
        <h2 className="font-semibold">{tPool("performanceTitle")}</h2>
        <ChartArea
          data={perfData}
          xKey="t"
          yKey="poolHashrate"
          yFormat="hashrate"
          carryForward
        />
        <AutoRefresh intervalMs={300_000} />
      </section>

      {/* Ports */}
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
            {ports.map((p) => (
              <tr key={p.port}>
                <Td>{p.port}</Td>
                <Td>{p.difficulty ?? "var"}</Td>
                <Td>
                  {p.varDiff
                    ? `${p.varDiff.minDiff} - ${p.varDiff.maxDiff}`
                    : "-"}
                </Td>
                <Td>{p.varDiff ? `${p.varDiff.targetTime}s` : "-"}</Td>
                <Td>{p.tls ? tServer("Common")("yes") : tServer("Common")("no")}</Td>
                <Td>
                  <code>
                    stratum+{p.tls ? "ssl" : "tcp"}://
                    {pool.coin?.symbol?.toLowerCase()}.hashstorm.org:{p.port}
                  </code>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      {/* Top Miners (se disponíveis) */}
      {Array.isArray(pool.topMiners) && pool.topMiners.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">{tPool("topMiners")}</h2>
          {async function TopMinersTable() {
            const rows = isSolo
              ? pool.topMiners!.map((m: any) => ({
                  ...m,
                  pendingShares: undefined,
                }))
              : await Promise.all(
                  pool.topMiners!.map(async (m: any) => {
                    try {
                      const d = await api.minerInPool(pool.id, m.miner);
                      return { ...m, pendingShares: d?.pendingShares };
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
                  {rows.map((m: any) => (
                    <tr key={m.miner}>
                      <Td>
                        <Link
                          className="underline"
                          href={`/pools/${pool.id}/miners/${m.miner}`}
                        >
                          {m.miner}
                        </Link>
                      </Td>
                      <Td>{fmtHashrate(m.hashrate)}</Td>
                      <Td>{fmtNum(m.sharesPerSecond, 4)}</Td>
                      {!isSolo && (
                        <Td>
                          {m.pendingShares != null
                            ? fmtNum(m.pendingShares, 4)
                            : "-"}
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            );
          }()}
        </section>
      )}

      {/* All Miners (paginated) */}
      <section className="space-y-2">
        <h2 className="font-semibold">All {tStat("miners")}</h2>
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
            {miners.length === 0 ? (
              <tr>
                <Td colSpan={isSolo ? 3 : 4} className="text-sm text-sub">
                  No miners yet.
                </Td>
              </tr>
            ) : (
              miners.map((m: any) => (
                <tr key={m.miner}>
                  <Td>
                    <Link
                      className="underline"
                      href={`/pools/${pool.id}/miners/${m.miner}`}
                    >
                      {m.miner}
                    </Link>
                  </Td>
                  <Td>{fmtHashrate(m.hashrate)}</Td>
                  <Td>{fmtNum(m.sharesPerSecond, 4)}</Td>
                  {!isSolo && (
                    <Td>
                      {m.pendingShares != null ? fmtNum(m.pendingShares, 4) : "-"}
                    </Td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </Table>
        <div className="flex items-center justify-between text-sm">
          <div>Page {minersPage}</div>
          <div className="space-x-2">
            {minersPage > 1 && (
              <Link
                className="underline"
                href={qp(searchParams, { minersPage: minersPage - 1 })}
              >
                Prev
              </Link>
            )}
            {minersHasNext && (
              <Link
                className="underline"
                href={qp(searchParams, { minersPage: minersPage + 1 })}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Last Blocks (paginated) */}
      <section className="space-y-2">
        <h2 className="font-semibold">Last {tPool("links.blocks")}</h2>
        <Table>
          <thead>
            <tr>
              <Th>{tPool("table.height")}</Th>
              <Th>{tPool("table.hash")}</Th>
              <Th>{tPool("table.date")}</Th>
              <Th>{tPool("table.status")}</Th>
            </tr>
          </thead>
          <tbody>
            {nBlocks.length === 0 ? (
              <tr>
                <Td colSpan={4} className="text-sm text-sub">
                  No blocks yet.
                </Td>
              </tr>
            ) : (
              nBlocks.map((b: any, i: number) => (
                <tr key={(b.hash ?? "") + (b.height ?? i)}>
                  <Td suppressHydrationWarning>
                    {b.height != null ? `#${b.height}` : "-"}
                  </Td>
                  <Td className="truncate max-w-[320px]">
                    {b.hash ? (
                      <Link
                        className="underline"
                        href={`/pools/${pool.id}/blocks`}
                      >
                        {b.hash}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    <LocalTime iso={b.created} fallback="" />
                  </Td>
                  <Td>{b.status ?? "-"}</Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        <div className="flex items-center justify-between text-sm">
          <div>Page {blocksPage}</div>
          <div className="space-x-2">
            {blocksPage > 1 && (
              <Link
                className="underline"
                href={qp(searchParams, { blocksPage: blocksPage - 1 })}
              >
                Prev
              </Link>
            )}
            {blocksHasNext && (
              <Link
                className="underline"
                href={qp(searchParams, { blocksPage: blocksPage + 1 })}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Pool info */}
      <section className="space-y-2">
        <h2 className="font-semibold">{tPool("sections.pool")}</h2>

        <div className="text-sm text-sub">
          Pool Address:{" "}
          {pool.address ? (
            <a
              className="underline"
              href={pool.addressInfoLink}
              target="_blank"
              rel="noreferrer"
            >
              {pool.address}
            </a>
          ) : (
            "-"
          )}{" "}
          • Last block:{" "}
          <LocalTime iso={pool.networkStats?.lastNetworkBlockTime} fallback="" /> (
          #{pool.networkStats?.blockHeight ?? "-"})
        </div>

        <div className="text-sm text-sub">
          {tPool("links.all")}:{" "}
          <Link className="underline" href={`/pools/${pool.id}/miners`}>
            {tPool("links.miners")}
          </Link>{" "}
          • {tPool("links.blocks")}:{" "}
          <Link className="underline" href={`/pools/${pool.id}/blocks`}>
            {tPool("links.blocks")}
          </Link>{" "}
          • {tPool("links.payments")}:{" "}
          <Link className="underline" href={`/pools/${pool.id}/payments`}>
            {tPool("links.payments")}
          </Link>
        </div>

        <div className="text-sm text-sub">
          {tPool("sections.community")}:{" "}
          {pool.coin?.discord && (
            <>
              <a className="underline" href={pool.coin.discord} target="_blank">
                Discord
              </a>{" "}
              •{" "}
            </>
          )}
          {pool.coin?.telegram && (
            <>
              <a className="underline" href={pool.coin.telegram} target="_blank">
                Telegram
              </a>{" "}
              •{" "}
            </>
          )}
          {pool.coin?.twitter && (
            <a className="underline" href={pool.coin.twitter} target="_blank">
              Twitter (X)
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
