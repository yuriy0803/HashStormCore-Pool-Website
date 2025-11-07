// ui/components/PoolCardsWall.tsx
import Link from "next/link";
import Image from "next/image";
import { coinIcon } from "@/lib/coins";
import { api } from "@/lib/api";
import { fmtNum } from "@/lib/format";

export const revalidate = 0;

type Snap = {
  poolId: string;
  unit: string;              // "H/s", "Sol/s", ...
  currentHashrate: number;   // live hashrate
  minersOnline: number;
  luckPercent?: number;
};

function fmtMetric(v: number, unit: string) {
  const a = Math.abs(v);
  const steps = [
    { k: 1e12, s: "T" },
    { k: 1e9, s: "G" },
    { k: 1e6, s: "M" },
    { k: 1e3, s: "K" },
  ];
  for (const st of steps) if (a >= st.k) return `${(v / st.k).toFixed(2)} ${st.s}${unit}`;
  return `${v.toFixed(2)} ${unit}`;
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
    />
  );
}

export default async function PoolCardsWall() {
  // base list: persisted
  const pools = await api.listPools().catch(() => []);

  // live snapshots
  const snaps = await Promise.all(
    pools.map(async (p: any) => {
      try {
        const s = await api.poolSnapshot(p.id);
        return {
          poolId: p.id,
          unit: s.unit || "H/s",
          currentHashrate: Number(s.currentHashrate ?? 0),
          minersOnline: Number(s.minersOnline ?? 0),
          luckPercent: s.round?.luckPercent,
        } as Snap;
      } catch {
        return {
          poolId: p.id,
          unit: "H/s",
          currentHashrate: 0,
          minersOnline: 0,
          luckPercent: undefined,
        } as Snap;
      }
    })
  );

  const byId = new Map(snaps.map((s) => [s.poolId, s]));

  if (pools.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--edge)] bg-[var(--card)] p-6 text-[var(--muted)]">
        No pools configured.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-3">
      {pools.map((p: any) => {
        const s = byId.get(p.id)!;

        const hasPorts = Object.keys(p?.ports ?? {}).length > 0;
        const active = (p?.enabled !== false) && hasPorts;

        const liveOk = (Number(s?.currentHashrate ?? 0) > 0) || (Number(s?.minersOnline ?? 0) > 0);

        const minPayout = p?.paymentProcessing?.minimumPayment;
        const coinSym = p?.coin?.symbol || "";
        const unit = s?.unit || "H/s";
        const hashrateVal = Number(s?.currentHashrate ?? 0);

        return (
          <div
            key={p.id}
            className={`rounded-2xl border px-0 py-0 overflow-hidden  border-bg-100/10 bg-[var(--card)]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--edge)]">
              <div className="flex items-center gap-2">
                {p.coin?.name && (
                  <Image
                    src={coinIcon(p.coin?.symbol ?? p.coin?.name)}
                    alt={(p.coin?.symbol ?? p.coin?.name) ?? "coin"}
                    width={36}
                    height={36}
                    priority
                  />
                )}
                <div className="font-semibold">
                  <Link className="hover:underline" href={`/pools/${p.id}`}>
                    {p.coin?.name || p.id}
                  </Link>
                </div>
              </div>
              <div className="text-right font-semibold">
                {fmtMetric(hashrateVal, unit)}
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Miners Online</span>
                <span>{fmtNum(s?.minersOnline ?? 0)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Luck</span>
                <span>
                  {s?.luckPercent != null ? `${fmtNum(s.luckPercent, 0)} %` : "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Minimum Payout</span>
                <span>
                  {minPayout != null ? `${fmtNum(minPayout)} ${coinSym}` : "-"}
                </span>
              </div>

              <div className="flex justify-between pt-1 border-t border-[var(--edge)]">
                <span className="text-[var(--muted)]">Status</span>
                <span className="inline-flex items-center gap-2">
                  {active ? "Active" : "Inactive"} <Dot ok={active} />    
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
