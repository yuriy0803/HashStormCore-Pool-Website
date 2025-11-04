// ui/components/PoolCard.tsx

import Link from "next/link";
import { Pool } from "@/lib/types";
import Stat from "./Stat";
import { fmtHashrate, fmtNum, fmtHashrateUnit } from "@/lib/format";
import { tServer } from "@/i18n/server";

import Image from "next/image";
import { coinIcon } from "@/lib/coins";

export default function PoolCard({ p }: { p: Pool }) {
  const tStat = tServer("Stat");

  const unit = String(p.coin?.family).toLowerCase() === "equihash" ? "Sol/s" : "H/s";

  return (
    <Link
      href={`/pools/${p.id}`}
      className="block rounded-2xl bg-card border border-edge p-4 hover:border-accent/60 transition"
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-lg">
          <Image
            src={coinIcon(p.coin?.symbol)}
            alt={p.coin?.symbol ?? "coin"}
            width={32}
            height={32}
          />
          {p.id.replaceAll("_", " ").toUpperCase()}
        </div>
        <div className="text-sub text-sm">
          {p.paymentProcessing.payoutScheme} • fee {p.poolFeePercent}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <Stat label={tStat("poolHashrate")} value={fmtHashrateUnit(p.poolStats.poolHashrate, unit)} />
        <Stat label={tStat("miners")} value={p.poolStats.connectedMiners} />
        <Stat label={tStat("netDiff")} value={fmtNum(p.networkStats.networkDifficulty)} />
      </div>
    </Link>
  );
}
