import { api } from "@/lib/api";
import PoolCard from "@/components/PoolCard";
import Stat from "@/components/Stat";
import { fmtHashrate } from "@/lib/format";
import { tServer } from "@/i18n/server";

export default async function CoinPoolsPage({ params }: { params: { symbol: string }}) {
  const tStat = tServer("Stat");
  const tCoin = tServer("CoinPools");

  const symbol = params.symbol.toUpperCase();
  const poolsAll = await api.listPools();
  const pools = poolsAll.filter(p => (p.coin?.symbol || "").toUpperCase() === symbol);

  const name = pools[0]?.coin?.name || symbol;

  const totalHashrate = pools.reduce((s, p) => s + (p.poolStats?.poolHashrate ?? 0), 0);
  const totalMiners = pools.reduce((s, p) => s + (p.poolStats?.connectedMiners ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* header mantém (se quiseres o ícone, volta a pôr o <Image /> e importa-o) */}
      <h1 className="text-xl font-semibold">{symbol} • {name}</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={tStat("totalHashrate")} value={fmtHashrate(totalHashrate)} />
        <Stat label={tStat("connectedMiners")} value={totalMiners} />
        <Stat label={tStat("pools")} value={pools.length} />
      </div>

      {pools.length === 0 ? (
        <div className="text-sub">{tCoin("noPools", { symbol })}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map(p => <PoolCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
