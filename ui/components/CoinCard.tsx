// ui/components/CoinCard.tsx
import Image from "next/image";
import Link from "next/link";
import { tServer } from "@/i18n/server";

export default function CoinCard({
  symbol, name, count
}: { symbol: string; name: string; count: number }) {
  const tHeader = tServer("Header");   // for “Pool”
  const tStat = tServer("Stat");       // for “Pool” / “allpools”

  const lower = symbol.toLowerCase();
  const poolsWord = tStat("pools");

  return (
    <Link
      href={`/allpools/${lower}`}
      className="rounded-2xl bg-card border border-edge p-4 hover:border-accent/60 transition flex items-center gap-4"
    >
      <Image
        src={`/coins/${name.toLowerCase()}.png`}
        alt={symbol}
        width={36}
        height={36}
      />
      <div className="flex-1">
        <div className="font-semibold">
          {symbol} ({name})
        </div>
        <div className="text-sub text-sm">
          {count} {poolsWord}
        </div>
      </div>
      <div className="text-sub text-sm">{tHeader("pools")}</div>
    </Link>
  );
}
