// ui/components/CoinCard.tsx
import Image from "next/image";
import Link from "next/link";

export default function CoinCard({
  symbol, name, count
}: { symbol: string; name: string; count: number }) {
  const lower = symbol.toLowerCase();
  return (
    <Link href={`/coins/${lower}`} className="rounded-2xl bg-card border border-edge p-4 hover:border-accent/60 transition flex items-center gap-4">
      <Image src={`/coins/${lower}.svg`} alt={symbol} width={36} height={36} />
      <div className="flex-1">
        <div className="font-semibold">{symbol} ({name})</div>
        <div className="text-sub text-sm">{count} pool{count === 1 ? "" : "s"}</div>
      </div>
      <div className="text-sub text-sm">Check pools</div>
    </Link>
  );
}
