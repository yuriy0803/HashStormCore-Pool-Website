// ui/app/pools/page.tsx
import { api } from "@/lib/api";
import Stat from "@/components/Stat";
import { tServer } from "@/i18n/server";
import PoolCardsWall from "@/components/PoolCardsWall";

export const revalidate = 0;

export default async function PoolsPage() {
  const tStat = tServer("Stat");
  const t = tServer("PoolsPage");

  const pools = await api.listPools().catch(() => []);

  // LIVE: total miners a partir de /api/live/status
  const status = await api.status().catch(() => null);
  const items: any[] = Array.isArray(status?.items) ? status!.items : [];
  const totalMiners = items.reduce((s, it) => s + Number(it?.minersOnline ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label={tStat("pools")} value={pools.length} />
        <Stat label={tStat("connectedMiners")} value={totalMiners} />
      </div>

      <h1 className="text-xl font-semibold">{t("title")}</h1>

      {/* LIVE wall com /api/live/pools/{id}/snapshot por pool */}
      <PoolCardsWall />
    </div>
  );
}
