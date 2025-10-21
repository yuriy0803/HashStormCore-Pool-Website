import Link from "next/link";
import { Pool } from "@/lib/types";
import Stat from "./Stat";
import { fmtHashrate, fmtNum } from "@/lib/format";

export default function PoolCard({ p }: { p: Pool }) {
  return (
    <Link href={`/pools/${p.id}`} className="block rounded-2xl bg-card border border-edge p-4 hover:border-accent/60 transition">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-lg">
          {p.coin?.symbol?.toUpperCase()} • {p.coin?.name} <span className="text-sub text-sm">({p.id})</span>
        </div>
        <div className="text-sub text-sm">{p.paymentProcessing?.payoutScheme} • fee {p.poolFeePercent}%</div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Stat label="Pool Hashrate" value={fmtHashrate(p.poolStats?.poolHashrate)} />
        <Stat label="Miners" value={p.poolStats?.connectedMiners ?? 0} />
        <Stat label="Net Diff" value={fmtNum(p.networkStats?.networkDifficulty)} />
      </div>
    </Link>
  );
}
