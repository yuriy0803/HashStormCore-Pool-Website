// components/CalculateHashrateByAlgo.tsx
import Stat from "@/components/Stat";
import { api } from "@/lib/api";
import { fmtHashrateUnit } from "@/lib/format";
import { getLiveWindowSec } from "@/lib/live";

type AlgoTotals = Record<string, { hashrate: number; unit: string; pools: number; miners: number }>;

function normalizeAlgo(p: any): string {
  // tenta várias origens coerentes com Miningcore/LiveController
  const algo =
    p?.algo ??
    p?.algorithm ??
    p?.coin?.algorithm ??
    p?.coin?.family ??
    (p?.unit === "Sol/s" ? "Equihash" : "UNKNOWN");
  return String(algo ?? "UNKNOWN").toUpperCase();
}

function pickUnit(item: any): "H/s" | "Sol/s" {
  const u = item?.unit;
  if (u === "H/s" || u === "Sol/s") return u;
  const fam = String(item?.coin?.family ?? "").toLowerCase();
  return fam.includes("equihash") ? "Sol/s" : "H/s";
}

function pickHashrate(item: any): number {
  // cobre as variantes usuais
  return Number(
    item?.currentHashrate ??
    item?.poolHashrate ??
    item?.hashrate ??
    item?.totalHashrate ??
    0
  );
}

function pickMiners(item: any): number {
  return Number(
    item?.minersOnline ??
    item?.connectedMiners ??
    item?.miners ??
    0
  );
}

function upsert(map: AlgoTotals, algo: string, h: number, unit: string, miners: number) {
  if (!map[algo]) map[algo] = { hashrate: 0, unit: unit || "H/s", pools: 0, miners: 0 };
  map[algo].hashrate += h || 0;
  map[algo].pools += 1;
  map[algo].miners += miners || 0;
}

export default async function CalculateHashrateByAlgo({ showTotals = true }: { showTotals?: boolean }) {
  const windowSec = getLiveWindowSec();

  const status = await api.status(windowSec).catch(() => null);
  const items: any[] = Array.isArray(status?.items) ? status!.items : [];

  const byAlgo: AlgoTotals = {};
  for (const it of items) {
    const algo = normalizeAlgo(it);
    const unit = pickUnit(it);
    const h = pickHashrate(it);
    const miners = pickMiners(it);
    upsert(byAlgo, algo, h, unit, miners);
  }

  const entries = Object.entries(byAlgo).sort(([a], [b]) => a.localeCompare(b));
  const totalHash = entries.reduce((s, [, v]) => s + v.hashrate, 0);
  const totalMiners = entries.reduce((s, [, v]) => s + v.miners, 0);
  const displayUnit = (items.find(i => i?.unit)?.unit === "Sol/s" ? "Sol/s" : "H/s") as "H/s" | "Sol/s";

  return (
    <section className="rounded-3xl border border-edge bg-card/60 p-6 md:p-8 space-y-4">
      {showTotals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Stat label="Total hashrate" value={fmtHashrateUnit(totalHash, displayUnit)} />
          <Stat label="Algorithms" value={entries.length} />
          <Stat label="Miners online" value={totalMiners} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {entries.map(([algo, v]) => (
          <div key={algo} className="rounded-2xl border border-edge/60 bg-card/50 p-4">
            <div className="text-sub text-xs mb-1">ALGORITHM</div>
            <div className="text-base font-semibold mb-3">{algo}</div>

            <div className="grid grid-cols-3 gap-2">
              <Stat label="Hashrate" value={fmtHashrateUnit(v.hashrate, v.unit as any)} compact />
              <Stat label="Pools" value={v.pools} compact />
              <Stat label="Miners" value={v.miners} compact />
            </div>
          </div>
        ))}
      </div>

      <div className="text-sub text-xs">
        Window: {windowSec}s · Fonte: /live/status (média por janela; sem picos “por share”)
      </div>
    </section>
  );
}
