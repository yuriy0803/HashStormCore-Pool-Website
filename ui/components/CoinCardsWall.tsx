// ui/components/CoinCardsWall.tsx
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { coinIcon } from "@/lib/coins";
import { fmtNum, fmtHashrateUnit } from "@/lib/format";

export const revalidate = 0;

type LiveSnap = {
  unit?: "H/s" | "Sol/s" | string;
  currentHashrate?: number;
  poolHashrate?: number;
  hashrate?: number;
  minersOnline?: number;
  connectedMiners?: number;
  miners?: number;
};

type CoinAgg = {
  symbol: string;
  name: string;
  unit: "H/s" | "Sol/s";
  hashrate: number;
  miners: number;
  minPayout?: number;
  link: string;
};

const pickUnit = (snap: LiveSnap | null | undefined, fam?: string): "H/s" | "Sol/s" => {
  if (snap?.unit === "H/s" || snap?.unit === "Sol/s") return snap.unit;
  return String(fam ?? "").toLowerCase().includes("equihash") ? "Sol/s" : "H/s";
};
const pickHashrate = (snap: LiveSnap | null | undefined) =>
  Number(snap?.currentHashrate ?? snap?.poolHashrate ?? snap?.hashrate ?? 0);
const pickMiners = (snap: LiveSnap | null | undefined, p: any) =>
  Number(snap?.minersOnline ?? snap?.connectedMiners ?? snap?.miners ?? p?.poolStats?.connectedMiners ?? 0);

export default async function CoinCardsWall() {
  const pools: any[] = await api.listPools().catch(() => []);
  if (pools.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-edge p-6 text-sub">No pools configured.</div>
    );
  }

  const snapsEntries = await Promise.all(
    pools.map(async (p) => {
      try {
        const s = await api.poolSnapshot(p.id);
        return [p.id, s as LiveSnap] as const;
      } catch {
        return [p.id, null] as const;
      }
    }),
  );
  const snaps: Record<string, LiveSnap | null> = Object.fromEntries(snapsEntries);

  // aggregate by coin
  const byCoin = new Map<string, CoinAgg>();
  for (const p of pools) {
    const sym = String(p?.coin?.symbol || "UNKNOWN").toUpperCase();
    const name = p?.coin?.name || sym;
    const snap = snaps[p.id];
    const unit = pickUnit(snap, p?.coin?.family);

    const agg = byCoin.get(sym) ?? {
      symbol: sym,
      name,
      unit,
      hashrate: 0,
      miners: 0,
      minPayout: undefined,
      link: `/allpools/${encodeURIComponent(sym)}`,
    };

    agg.hashrate += pickHashrate(snap);
    agg.miners += pickMiners(snap, p);
    agg.unit = unit;

    const mp = Number(p?.paymentProcessing?.minimumPayment ?? NaN);
    if (Number.isFinite(mp)) agg.minPayout = agg.minPayout == null ? mp : Math.min(agg.minPayout, mp);

    byCoin.set(sym, agg);
  }

  const cards = Array.from(byCoin.values()).sort((a, b) => b.hashrate - a.hashrate);

  // ⬇️ Mantém o layout (mesma grid), só o design é igual ao PoolCard e o card é clicável
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
      {cards.map((c) => (
        <Link
          key={c.symbol}
          href={c.link}
          className="block rounded-2xl bg-card border border-edge p-4 hover:border-accent/60 transition"
          aria-label={`${c.name} (${c.symbol})`}
        >
          {/* Header (igual estilo PoolCard) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Image src={coinIcon(c.symbol)} alt={c.symbol} width={32} height={32} />
              {c.name}
            </div>
            <div className="text-sub text-sm">{c.symbol}</div>
          </div>

          {/* KPIs (3 colunas como PoolCard) */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <StatLike label="Hashrate" value={fmtHashrateUnit(c.hashrate, c.unit)} />
            <StatLike label="Miners" value={fmtNum(c.miners, 0)} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatLike({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-black/10 border border-edge/60 px-3 py-2">
      <div className="text-xs text-sub">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
