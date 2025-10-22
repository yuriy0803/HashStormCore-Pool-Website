import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import { fmtHashrate, fmtNum } from "@/lib/format";
import Link from "next/link";

// ui/pools/[id]/miners/page.tsx
export default async function PoolMiners({ params }: { params: { id: string }}) {
  const miners = await api.listPoolMiners(params.id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Miners - {params.id}</h1>
      <Table>
        <thead><tr><Th>Miner</Th><Th>Hashrate</Th><Th>Shares/s</Th></tr></thead>
        <tbody>
          {miners.map(m => (
            <tr key={m.miner}>
              <Td><Link className="underline" href={`/pools/${params.id}/miners/${m.miner}`}>{m.miner}</Link></Td>
              <Td>{fmtHashrate(m.hashrate)}</Td>
              <Td>{fmtNum(m.sharesPerSecond, 4)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
