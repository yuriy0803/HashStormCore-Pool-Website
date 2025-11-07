// ui/app/getting-started/page.tsx
import { api } from "@/lib/api";
import GettingStartedClient from "./GettingStartedClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type SearchParams = { [k: string]: string | string[] | undefined };
const pick = (v?: string | string[]) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")) || "";

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const pools = (await api.listPools().catch(() => [])) as any[];

  // LIVE: snapshot por pool para métricas corretas
  const entries = await Promise.all(
    pools.map(async (p) => {
      try {
        const snap = await api.poolSnapshot(p.id);
        return [p.id, snap] as const;
      } catch {
        return [p.id, null] as const;
      }
    })
  );
  const liveById = Object.fromEntries(entries);

  const initial = {
    algo: pick(searchParams?.algo),
    coin: pick(searchParams?.coin),
    pool: pick(searchParams?.pool),
  };

  return <GettingStartedClient pools={pools} live={liveById} initial={initial} />;
}
