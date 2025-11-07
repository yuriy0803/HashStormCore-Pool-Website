// ui/app/getting-started/GettingStartedClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { fmtNum, fmtHashrateUnit } from "@/lib/format";
import MiningCommand from "@/components/MiningCommand";

type Pool = any;
type LiveSnap = {
  unit?: "H/s" | "Sol/s" | string;
  currentHashrate?: number;
  poolHashrate?: number;
  hashrate?: number;
  minersOnline?: number;
  connectedMiners?: number;
  miners?: number;
  network?: { difficulty?: number; diff?: number; height?: number; blockHeight?: number };
  round?: { luckPercent?: number };
};

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

const algoOf = (p: Pool) =>
  String(p?.coin?.algorithm ?? p?.coin?.family ?? "UNKNOWN");

const coinOf = (p: Pool) => String(p?.coin?.symbol ?? "UNKNOWN").toUpperCase();

const unitOf = (snap?: LiveSnap, p?: Pool): "H/s" | "Sol/s" => {
  if (snap?.unit === "H/s" || snap?.unit === "Sol/s") return snap.unit;
  const fam = String(p?.coin?.family ?? "").toLowerCase();
  return fam.includes("equihash") ? "Sol/s" : "H/s";
};

const pickHashrate = (s?: LiveSnap): number =>
  Number(
    s?.currentHashrate ??
    s?.poolHashrate ??
    s?.hashrate ??
    0
  );

const pickMiners = (s?: LiveSnap): number =>
  Number(
    s?.minersOnline ??
    s?.connectedMiners ??
    s?.miners ??
    0
  );

const pickNetDiff = (s?: LiveSnap): number =>
  Number(
    s?.network?.difficulty ??
    s?.network?.diff ??
    0
  );

const pickHeight = (s?: LiveSnap): number =>
  Number(
    s?.network?.height ??
    s?.network?.blockHeight ??
    0
  );

export default function GettingStartedClient({
  pools,
  live: liveProp,
  initial,
}: {
  pools: Pool[];
  live?: Record<string, LiveSnap | null>; // opcional
  initial: { algo: string; coin: string; pool: string };
}) {
  const live = liveProp ?? {};
  const [algo, setAlgo] = React.useState(initial.algo || "");
  const [coin, setCoin] = React.useState(initial.coin || "");
  const [poolId, setPoolId] = React.useState(initial.pool || "");
  const [copied, setCopied] = React.useState(false);

  // ----- listas derivadas -----
  const allAlgos = React.useMemo(() => uniq(pools.map(algoOf)).sort(), [pools]);

  const coinsForAlgo = React.useMemo(() => {
    const src = algo ? pools.filter((p) => algoOf(p) === algo) : pools;
    return uniq(src.map(coinOf)).sort();
  }, [pools, algo]);

  const poolsForCoin = React.useMemo(() => {
    if (!coin) return [];
    return pools.filter((p) => coinOf(p) === coin && (!algo || algoOf(p) === algo));
  }, [pools, coin, algo]);

  // ----- auto-select da pool quando muda coin/algo -----
  React.useEffect(() => {
    if (!coin) {
      setPoolId("");
      return;
    }
    if (poolsForCoin.length && !poolId) {
      setPoolId(poolsForCoin[0].id);
    } else if (poolId && !poolsForCoin.find((p) => p.id === poolId)) {
      setPoolId(poolsForCoin[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin, algo, poolsForCoin.map((p) => p.id).join("|")]);

  const selectedPool =
    (poolId && pools.find((p) => p.id === poolId)) ||
    (poolsForCoin.length ? poolsForCoin[0] : null);

  // ----- sync URL -----
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (algo) params.set("algo", algo);
    if (coin) params.set("coin", coin);
    if (selectedPool?.id) params.set("pool", selectedPool.id);
    const qs = params.toString();
    const href = qs ? `/getting-started?${qs}` : `/getting-started`;
    window.history.replaceState(null, "", href);
  }, [algo, coin, selectedPool?.id]);

  // ================== AGGREGATIONS ==================
  // View 1: por ALGORITHM (default)
  const rowsAlgo = React.useMemo(() => {
    const groups = new Map<
      string,
      { hashrate: number; miners: number; coins: Set<string>; unit: "H/s" | "Sol/s" }
    >();

    for (const p of pools) {
      const a = algoOf(p);
      const s: LiveSnap = (live && live[p.id]) || {};
      const unit = unitOf(s, p);
      const prev = groups.get(a) ?? {
        hashrate: 0,
        miners: 0,
        coins: new Set<string>(),
        unit,
      };
      prev.hashrate += pickHashrate(s);
      prev.miners += pickMiners(s);
      prev.coins.add(coinOf(p));
      prev.unit = unit;
      groups.set(a, prev);
    }

    return Array.from(groups.entries())
      .map(([name, g]) => ({
        algo: name,
        unit: g.unit,
        totalHashrate: g.hashrate,
        totalMiners: g.miners,
        coinsCount: g.coins.size,
      }))
      .sort((x, y) => x.algo.localeCompare(y.algo));
  }, [pools, live]);

  // View 2: por COIN dentro do ALGO selecionado
  const rowsCoin = React.useMemo(() => {
    if (!algo) return [];
    const src = pools.filter((p) => algoOf(p) === algo);
    const groups = new Map<
      string,
      { hashrate: number; miners: number; unit: "H/s" | "Sol/s"; netDiff?: number; pending: number }
    >();

    for (const p of src) {
      const c = coinOf(p);
      const s: LiveSnap = (live && live[p.id]) || {};
      const unit = unitOf(s, p);
      const prev = groups.get(c) ?? {
        hashrate: 0,
        miners: 0,
        unit,
        netDiff: undefined,
        pending: 0,
      };
      prev.hashrate += pickHashrate(s);
      prev.miners += pickMiners(s);
      prev.unit = unit;
      if (prev.netDiff == null && pickNetDiff(s) > 0) {
        prev.netDiff = pickNetDiff(s);
      }
      prev.pending += Number(p?.totalPendingBlocks ?? 0);
      groups.set(c, prev);
    }

    return Array.from(groups.entries())
      .map(([coinSym, g]) => ({
        coin: coinSym,
        unit: g.unit,
        totalHashrate: g.hashrate,
        totalMiners: g.miners,
        netDiff: g.netDiff ?? 0,
        pending: g.pending,
      }))
      .sort((x, y) => x.coin.localeCompare(y.coin));
  }, [pools, live, algo]);

  // View 3: POOLS dentro da COIN (e opcionalmente ALGO)
  const rowsPools = React.useMemo(() => {
    if (!coin) return [];
    const src = pools.filter(
      (p) => coinOf(p) === coin && (!algo || algoOf(p) === algo)
    );

    return src.map((p) => {
      const s: LiveSnap = (live && live[p.id]) || {};
      const unit = unitOf(s, p);
      const ph = pickHashrate(s);
      const miners = pickMiners(s);
      const netDiff = pickNetDiff(s);
      const height = pickHeight(s);
      const pending = Number(p?.totalPendingBlocks ?? 0);
      const reward = Number(p?.blockReward ?? 0);

      const ports = Object.entries(p?.ports ?? {}).map(([port, cfg]: any) => ({
        port,
        tls: !!cfg?.tls,
        diff: Number(cfg?.difficulty ?? NaN),
      }));
      const fixedDiffs = ports.map((x) => x.diff).filter((x) => Number.isFinite(x));
      const poolDiff = fixedDiffs.length ? Math.min(...fixedDiffs) : NaN;

      return {
        id: p.id,
        name: p.id.replaceAll("_", " "),
        algo: algoOf(p),
        coin: coinOf(p),
        poolHashrate: fmtHashrateUnit(ph, unit),
        miners: fmtNum(miners, 0),
        poolDiff: Number.isFinite(poolDiff) ? fmtNum(poolDiff, 0) : "var",
        netDiff: fmtNum(netDiff, 2),
        height: `#${fmtNum(height, 0)}`,
        pending: fmtNum(pending, 0),
        reward: fmtNum(reward, 4),
        ports,
      };
    });
  }, [pools, live, coin, algo]);

  // ---------- How to connect (MiningCommand) ----------
  const hcSource = selectedPool || null;
  const hcPorts =
    hcSource
      ? (Object.entries(hcSource.ports ?? {}).map(([port, cfg]: any) => ({
          port,
          tls: !!cfg?.tls,
          diff: cfg?.difficulty as number | undefined,
        })) as { port: string; tls: boolean; diff?: number }[])
      : [];
  const hcHost = hcSource
    ? `${String(hcSource?.coin?.symbol ?? "").toLowerCase()}.hashstorm.org`
    : "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Getting Started</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT: filtros + How to connect */}
        <aside className="md:col-span-1 space-y-4">
          {/* chooseAlgorithm */}
          <div className="rounded-2xl border border-edge bg-card/60 p-4">
            <h3 className="font-semibold mb-3">Algorithm</h3>
            <select
              className="w-full rounded-xl bg-card border border-edge px-3 py-2"
              value={algo}
              onChange={(e) => {
                setAlgo(e.currentTarget.value);
                setCoin("");
                setPoolId("");
              }}
            >
              <option value="">All algorithms</option>
              {allAlgos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* chooseCoin */}
          <div className="rounded-2xl border border-edge bg-card/60 p-4">
            <h3 className="font-semibold mb-3">Coin</h3>
            <select
              className="w-full rounded-xl bg-card border border-edge px-3 py-2"
              value={coin}
              onChange={(e) => {
                setCoin(e.currentTarget.value);
                setPoolId("");
              }}
            >
              <option value="">All coins</option>
              {coinsForAlgo.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* choosePool */}
          <div className="rounded-2xl border border-edge bg-card/60 p-4">
            <h3 className="font-semibold mb-3">Pool</h3>
            <select
              className="w-full rounded-xl bg-card border border-edge px-3 py-2"
              value={poolId}
              onChange={(e) => setPoolId(e.currentTarget.value)}
              disabled={!coin || poolsForCoin.length === 0}
            >
              {!coin && <option value="">Select a coin first</option>}
              {coin && poolsForCoin.length === 0 && (
                <option value="">No pools for this coin</option>
              )}
              {coin &&
                poolsForCoin.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id.replaceAll("_", " ")}
                  </option>
                ))}
            </select>
          </div>

          {/* How to connect (usa MiningCommand) */}
          <div className="rounded-2xl border border-edge bg-card/60 p-5">
            <h3 className="font-semibold mb-2">How to connect</h3>
            {!hcSource ? (
              <p className="text-sm text-sub">
                Seleciona um algoritmo/coin e (opcionalmente) uma pool para ver o comando.
              </p>
            ) : (
              <MiningCommand
                coinSymbol={hcSource?.coin?.symbol}
                algo={hcSource?.coin?.algorithm ?? hcSource?.coin?.family}
                domainForCoin={hcHost}
                ports={hcPorts}
                defaultMiner="GMINER"
                onCopy={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1000);
                }}
              />
            )}
            {copied && <div className="mt-2 text-xs text-emerald-400">Copied!</div>}
          </div>
        </aside>

        {/* RIGHT: Tabelas dinâmicas */}
        <section className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-edge bg-card/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">
                {(!algo && !coin) && "Algorithms"}
                {(algo && !coin) && `Coins — ${algo}`}
                {(algo && coin) && `Pools — ${algo} • ${coin}`}
              </div>
            </div>

            {/* View 1: Algorithms */}
            {!algo && !coin && (
              <div className="rounded-xl border border-edge/60 overflow-x-auto">
                <table className="w-full text-xs leading-tight">
                  <thead className="bg-card/60">
                    <tr className="[&>th]:px-2 [&>th]:py-2 text-left">
                      <th>Algo</th>
                      <th>Hashrate</th>
                      <th>Miners</th>
                      <th>Coins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsAlgo.length === 0 ? (
                      <tr>
                        <td className="px-2 py-3 text-sub" colSpan={4}>
                          No data.
                        </td>
                      </tr>
                    ) : (
                      rowsAlgo.map((r) => (
                        <tr key={r.algo} className="border-t border-edge/60">
                          <td className="px-2 py-2">{r.algo}</td>
                          <td className="px-2 py-2 font-mono">
                            {fmtHashrateUnit(r.totalHashrate, r.unit)}
                          </td>
                          <td className="px-2 py-2">{fmtNum(r.totalMiners, 0)}</td>
                          <td className="px-2 py-2">{fmtNum(r.coinsCount, 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 2: Coins for selected Algo */}
            {algo && !coin && (
              <div className="rounded-xl border border-edge/60 overflow-x-auto">
                <table className="w-full text-xs leading-tight">
                  <thead className="bg-card/60">
                    <tr className="[&>th]:px-2 [&>th]:py-2 text-left">
                      <th>Coin</th>
                      <th>Hashrate</th>
                      <th>Miners</th>
                      <th>Network Diff</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsCoin.length === 0 ? (
                      <tr>
                        <td className="px-2 py-3 text-sub" colSpan={5}>
                          No data.
                        </td>
                      </tr>
                    ) : (
                      rowsCoin.map((r) => (
                        <tr key={r.coin} className="border-t border-edge/60">
                          <td className="px-2 py-2">{r.coin}</td>
                          <td className="px-2 py-2 font-mono">
                            {fmtHashrateUnit(r.totalHashrate, r.unit)}
                          </td>
                          <td className="px-2 py-2">{fmtNum(r.totalMiners, 0)}</td>
                          <td className="px-2 py-2">{fmtNum(r.netDiff, 2)}</td>
                          <td className="px-2 py-2">{fmtNum(r.pending, 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 3: Pools for selected Coin (and optional Algo) */}
            {coin && (
              <div className="rounded-xl border border-edge/60 overflow-x-auto">
                <table className="w-full text-xs leading-tight">
                  <thead className="bg-card/60">
                    <tr className="[&>th]:px-2 [&>th]:py-2 text-left">
                      <th>Pool</th>
                      <th>Algo</th>
                      <th>Coin</th>
                      <th>Pool Hashrate</th>
                      <th>Miners</th>
                      <th>Pool Diff</th>
                      <th>Net Diff</th>
                      <th>Height</th>
                      <th>Pending</th>
                      <th>Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsPools.length === 0 ? (
                      <tr>
                        <td className="px-2 py-3 text-sub" colSpan={10}>
                          No data.
                        </td>
                      </tr>
                    ) : (
                      rowsPools.map((r) => (
                        <tr key={r.id} className="border-t border-edge/60">
                          <td className="px-2 py-2">
                            <Link className="link" href={`/pools/${encodeURIComponent(r.id)}`}>
                              {r.name}
                            </Link>
                          </td>
                          <td className="px-2 py-2">{r.algo}</td>
                          <td className="px-2 py-2">{r.coin}</td>
                          <td className="px-2 py-2 font-mono">{r.poolHashrate}</td>
                          <td className="px-2 py-2">{r.miners}</td>
                          <td className="px-2 py-2">{r.poolDiff}</td>
                          <td className="px-2 py-2">{r.netDiff}</td>
                          <td className="px-2 py-2">{r.height}</td>
                          <td className="px-2 py-2">{r.pending}</td>
                          <td className="px-2 py-2">{r.reward}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
