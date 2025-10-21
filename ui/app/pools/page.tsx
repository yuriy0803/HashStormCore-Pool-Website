import { api } from "@/lib/api";
import PoolCard from "@/components/PoolCard";

export default async function PoolsPage() {
  const pools = await api.listPools().catch(()=>[]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">All Pools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pools.map(p => <PoolCard key={p.id} p={p}/>)}
      </div>
    </div>
  );
}
