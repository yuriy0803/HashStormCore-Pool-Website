import { api, fmtIsoToLocal, toIso as toIsoApi, LIVE_WINDOW_SEC } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import Stat from "@/components/Stat";
import Link from "next/link";
import { fmtHashrateUnit, fmtNum } from "@/lib/format";
import { tServer } from "@/i18n/server";
import ChartArea from "@/components/ChartArea";
import AutoRefresh from "@/components/AutoRefresh";
import LocalTime from "@/components/LocalTime";
import LivePoolStats from "@/components/LivePoolStats";
import Image from "next/image";
import { coinIcon } from "@/lib/coins";
import { diff } from "util";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type SearchParams = { [k: string]: string | string[] | undefined };
const PAGE_SIZE = 10;

function intParam(v: string | string[] | undefined, fallback = 1) {
  const n = Array.isArray(v) ? v[0] : v;
  const x = Number.parseInt(String(n ?? "")) || fallback;
  return Math.max(1, x);
}

// local proxy for api toIso
function toIso(v: unknown) {
  return toIsoApi(v as any);
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

  // pool
  const pool = await api.getPool(params.id);
  if (!pool) return <div className="text-[var(--muted)]">Pool not found.</div>;

  // SSR: snapshot + performance
  let snapshot: any = null;
  try { snapshot = await api.poolSnapshot(pool.id); } catch { }
  const perf = await api.getPoolPerformance(pool.id);

  const ports = Object.entries(pool.ports ?? {}).map(([port, cfg]) => ({
    port,
    difficulty: (cfg as any)?.difficulty,
    tls: (cfg as any)?.tls,
    varDiff: (cfg as any)?.varDiff,
  }));

  const unit = (snapshot?.unit === "Sol/s" || snapshot?.unit === "H/s")
    ? snapshot.unit
    : (String(pool.coin?.family).toLowerCase() === "equihash" ? "Sol/s" : "H/s");

  // ---- pagination state
  const minersPage = intParam(searchParams?.minersPage, 1);
  const blocksPage = intParam(searchParams?.blocksPage, 1);
  const blocksPageSize = intParam(searchParams?.blocksPageSize, PAGE_SIZE);

  // ---- blocks
  const blocksResp = await api.listPoolBlocks(pool.id, blocksPage, blocksPageSize);
  const blocks = Array.isArray(blocksResp?.blocks) ? blocksResp.blocks : [];
  const blocksTotal = Number(blocksResp?.total ?? 0);
  const blocksHasNext = blocksPage * blocksPageSize < blocksTotal;

  const isSolo =
    (pool.paymentProcessing?.payoutScheme || "").toUpperCase() === "SOLO";

  // normalize blocks for render
  const nBlocks = blocks.map((b: any, i: number) => {

    return {
      height: b.blockHeight ?? null,
      diff: b.networkDifficulty ?? null,
      transactionConfirmationData: b.transactionConfirmationData ?? null,
      hash: b.hash ?? null,
      created: b.created ?? null,
      reward: b.reward ?? null,
      effort: b.effort ?? null,
      minerEffort: b.minerEffort ?? null,
      status:
        b.status ??
        (b.confirmed === true
          ? "confirmed"
          : b.confirmed === false
            ? "pending"
            : undefined),
    };
  });




  // perf data -> ChartArea (x in epoch ms)
  let perfData = (Array.isArray(perf) ? perf : [])
    .map((p: any) => {
      const iso = toIso(p.created ?? p.time ?? p.timestamp);
      const t = iso ? new Date(iso).getTime() : undefined;
      return {
        t,
        poolHashrate: Number(p.poolHashrate ?? 0),
        connectedMiners: Number(p.connectedMiners ?? 0),
      };
    })
    .filter((d) => typeof d.t === "number" && !Number.isNaN(d.t));

  // fallback: if performance is empty, use a snapshot point (not to be blank graphic)
  if (perfData.length === 0 && snapshot?.asOf && Number.isFinite(Number(snapshot?.currentHashrate))) {
    perfData = [{
      t: new Date(snapshot.asOf).getTime(),
      poolHashrate: Number(snapshot.currentHashrate),
      connectedMiners: Number(snapshot.minersOnline ?? 0),
    }];
  }

  /********** FOR NON DEVS "SSR" MEANS SERVER SIDE RESPONSE **********/
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          {pool.coin?.name && (
            <Image
              src={coinIcon(pool?.coin?.symbol)}
              alt={pool?.coin?.symbol ?? "coin"}
              width={36}
              height={36}
              priority
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

      {/* KPIs LIVE with initial SSR */}
      <LivePoolStats
        poolId={pool.id}
        unit={unit}
        initial={{
          unit,
          currentHashrate: Number(snapshot?.currentHashrate ?? 0),
          minersOnline: Number(snapshot?.minersOnline ?? 0),
          network: {
            hashrate: Number(snapshot?.network?.hashrate ?? 0),
            difficulty: Number(snapshot?.network?.difficulty ?? 0),
          },
        }}
      />

      {/* How to connect */}
      <section>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="font-semibold mb-2">How to connect</h3>
          <p className="text-sm text-sub mb-3">
            Use your <b>wallet address</b> as username and any password (e.g. <code>x</code>).
            Choose one of the endpoints:
          </p>
          <ul className="text-sm space-y-1">
            {ports.map((p) => (
              <li key={p.port}>
                <code>
                  stratum+{p.tls ? "ssl" : "tcp"}://
                  {pool.coin?.symbol?.toLowerCase()}.hashstorm.org:{p.port}
                </code>{" "}
                | Minimum Payout {fmtNum(pool.paymentProcessing?.minimumPayment)} {pool.coin?.symbol}
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
          unit={unit}
          carryForward
          stepMinutes={60}
          labelEvery={60}
        />
        <AutoRefresh intervalMs={15000} />
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
                <Td>{p.varDiff ? `${p.varDiff.minDiff} - ${p.varDiff.maxDiff}` : "-"}</Td>
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

      {/* All Miners (LIVE) */}
      <section className="space-y-2">
        <h2 className="font-semibold">All {tStat("miners")} (live)</h2>
        {await (async () => {
          // -------- pagination --------
          const PAGE_MINERS =
            Number(Array.isArray(searchParams?.minersPageSize) ? searchParams!.minersPageSize[0] : searchParams?.minersPageSize) || PAGE_SIZE; // default 10
          const page = minersPage;
          const start = (page - 1) * PAGE_MINERS;
          const end = start + PAGE_MINERS;

          // ------- live data source -------- 
          let liveTop: any = null;
          try {
            // 5 Min window (300s)
            // 10 Min window (600s)
            liveTop = await api.poolTopMiners(pool.id, LIVE_WINDOW_SEC, 10000);
          } catch {
            liveTop = null;
          }

          const liveItems: any[] = Array.isArray(liveTop?.items) ? liveTop.items : [];
          const liveUnit: "H/s" | "Sol/s" =
            (pool.coin?.algorithm || "").toLowerCase().includes("equihash") ? "Sol/s" : "H/s";

          // base rows (endereços)
          const baseRows =
            liveItems.length > 0
              ? liveItems.map((m: any) => ({ miner: m.address }))
              : (await api.listPoolMiners(pool.id)).map((m: any) => ({ miner: m.miner }));

          // paginação "grossa"
          const sliceForCalls = baseRows.slice(start, end);

          // --------- fetch snapshots dos visíveis ----------
          const rows = await Promise.all(
            sliceForCalls.map(async (m) => {
              try {
                // tenta live snapshot para decidir online/hashrate de forma fiável
                const liveSnap = await api.minerSnapshot?.(pool.id, m.miner, LIVE_WINDOW_SEC).catch(() => null);
                if (liveSnap) {
                  return {
                    miner: m.miner,
                    hashrate: Number(liveSnap.currentHashrate ?? 0),
                    sharesPerSecond: Number(liveSnap.sharesPerSec ?? liveSnap.sharesPerSecond ?? 0),
                    online: !!liveSnap.online,
                  };
                }

                // fallback para snapshot "normal"
                const snap = await api.minerSnapshot(pool.id, m.miner);
                return {
                  miner: m.miner,
                  hashrate: Number(snap?.currentHashrate ?? 0),
                  sharesPerSecond: Number(snap?.sharesPerSec ?? snap?.sharesPerSecond ?? 0),
                  online: undefined,
                };
              } catch {
                return { miner: m.miner, hashrate: 0, sharesPerSecond: 0, online: undefined };
              }
            })
          );

          // filtra miners com hashrate == 0 E shares == 0 (esconde "fantasmas")
          const rowsFiltered = rows.filter(r => (r.hashrate ?? 0) > 0 || (r.sharesPerSecond ?? 0) > 0);

          // helper para manter os outros query params
          const withQuery = (overrides: Record<string, any>) => ({
            pathname: `/pools/${pool.id}`,
            query: {
              ...searchParams,
              ...overrides,
            },
          });

          // contagem e paginação visível baseada no filtrado
          const total = liveItems.length > 0
            ? liveItems.length // quando temos liveTop, já vem "limpo" normalmente
            : rowsFiltered.length; // fallback: conta os não-zero na página

          const hasPrev = page > 1;
          const hasNext = baseRows.length > end; // mantém navegação simples

          return (
            <>
              <div className="text-sm text-sub">
                {rowsFiltered.length === 0 ? "No miners online." : `Showing ${rowsFiltered.length > 0 ? start + 1 : 0}-${Math.min(end, start + rowsFiltered.length)} of ${total}`}
              </div>

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
                  {rowsFiltered.length === 0 ? (
                    <tr>
                      <Td colSpan={isSolo ? 3 : 4} className="text-sm text-sub">
                        No miners online.
                      </Td>
                    </tr>
                  ) : (
                    rowsFiltered.map((m) => (
                      <tr key={m.miner}>
                        <Td>
                          <Link className="underline" href={`/pools/${pool.id}/miners/${m.miner}`}>
                            {m.miner}
                          </Link>
                        </Td>
                        <Td>{fmtHashrateUnit(m.hashrate, liveUnit)}</Td>
                        <Td>{m.sharesPerSecond ? fmtNum(m.sharesPerSecond, 4) : "-"}</Td>
                        {!isSolo && <Td>-</Td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              <div className="flex items-center justify-between text-sm">
                <div className="space-x-3">
                  <div className="text-sm text-sub">
                    <span>Page {page}
                      <br />
                      Per page:{" "}
                      <Link className="underline" href={withQuery({ minersPageSize: 10, minersPage: 1 })}>10</Link>{" "}
                      · <Link className="underline" href={withQuery({ minersPageSize: 25, minersPage: 1 })}>25</Link>{" "}
                      · <Link className="underline" href={withQuery({ minersPageSize: 50, minersPage: 1 })}>50</Link>
                    </span>
                  </div>
                </div>
                <div className="space-x-2">
                  {hasPrev && (
                    <Link className="underline" href={withQuery({ minersPage: page - 1 })}>
                      Prev
                    </Link>
                  )}
                  {hasNext && (
                    <Link className="underline" href={withQuery({ minersPage: page + 1 })}>
                      Next
                    </Link>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </section>

      {/* Last Blocks (paginated) */}
      <section className="space-y-2">
        <h2 className="font-semibold">Last {tPool("links.blocks")}</h2>

        {(() => {
          const from = blocksTotal === 0 ? 0 : (blocksPage - 1) * blocksPageSize + 1;
          const to = Math.min(blocksPage * blocksPageSize, blocksTotal);

          const withQuery = (overrides: Record<string, any>) => ({
            pathname: `/pools/${pool.id}`,
            query: { ...searchParams, ...overrides },
          });

          return (
            <>
              <div className="text-sm text-sub">
                {blocksTotal === 0 ? "No blocks yet." : `Showing ${from}-${to} of ${blocksTotal}`}
              </div>

              <Table>
                <thead>
                  <tr>
                    <Th>{tPool("table.height")}</Th>
                    <Th>{tPool("table.hash")}</Th>
                    <Th>{tPool("table.date")}</Th>
                    <Th>Miner Effort</Th>
                    <Th>Reward</Th>
                    <Th>{tPool("table.status")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.length === 0 ? (
                    <tr>
                      <Td colSpan={4} className="text-sm text-sub">No blocks yet.</Td>
                    </tr>
                  ) : (
                    nBlocks.map((b: any, i: number) => (
                      <tr key={`${b.hash ?? ""}-${b.height ?? i}`}>
                        <Td>{b.height != null ? `#${b.height}` : "-"}</Td>
                        <Td className="truncate max-w-[420px]">
                          {b.hash ? (
                            <Link className="underline" href={`/pools/${pool.id}/blocks`}>
                              {b.hash}
                            </Link>
                          ) : ("-")}
                        </Td>
                        <Td suppressHydrationWarning>
                          {fmtIsoToLocal(b.created)}
                        </Td>
                        <Td>{b.minerEffort > 0 ? fmtNum(b.minerEffort * 100) + "%" : "NaN"}</Td>
                        <Td>{b.reward ?? "NaN"}</Td>
                        <Td>{b.status ?? "NaN"}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              <div className="flex items-center justify-between text-sm">
                <div className="space-x-3">
                  <div className="text-sm text-sub">
                    <span>Page {blocksPage}
                      <br></br>
                      Per page:{" "}
                      <Link className="underline" href={withQuery({ blocksPageSize: 10, blocksPage: 1 })}>10</Link>{" "}
                      · <Link className="underline" href={withQuery({ blocksPageSize: 25, blocksPage: 1 })}>25</Link>{" "}
                      · <Link className="underline" href={withQuery({ blocksPageSize: 50, blocksPage: 1 })}>50</Link>
                    </span>
                  </div>
                </div>
                <div className="space-x-2">
                  {blocksPage > 1 && (
                    <Link className="underline" href={withQuery({ blocksPage: blocksPage - 1 })}>
                      Prev
                    </Link>
                  )}
                  {blocksHasNext && (
                    <Link className="underline" href={withQuery({ blocksPage: blocksPage + 1 })}>
                      Next
                    </Link>
                  )}
                </div>
              </div>

              {/* light refreshment of block listing */}
              <AutoRefresh everySec={60} />
            </>
          );
        })()}
      </section>

      {/* Pool info */}
      <section className="space-y-2">
        <h2 className="font-semibold">{tPool("sections.poolinfo")}</h2>

        <div className="text-sm text-sub">
          Pool Address:{" "}
          {pool.address ? (
            <a className="underline" href={pool.addressInfoLink} target="_blank" rel="noreferrer">
              {pool.address}
            </a>
          ) : (
            "-"
          )}{" "}
          • Last block:{" "}
          <LocalTime iso={toIso(pool.networkStats?.lastNetworkBlockTime)} fallback="-" /> (
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
