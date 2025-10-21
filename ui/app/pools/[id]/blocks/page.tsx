import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import { fmtNum, fmtISO, short } from "@/lib/format";

export default async function PoolBlocks({ params }: { params: { id: string }}) {
  const blocks = await api.listPoolBlocks(params.id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Blocks - {params.id}</h1>
      <Table>
        <thead>
          <tr><Th>Height</Th><Th>Status</Th><Th>Efficiency</Th><Th>Miner</Th><Th>Reward</Th><Th>Hash</Th><Th>Data</Th></tr>
        </thead>
        <tbody>
          {blocks.map(b => (
            <tr key={`${b.blockHeight}-${b.hash}`}>
              <Td>#{b.blockHeight}</Td>
              <Td>{b.status}</Td>
              <Td>{fmtNum(b.effort, 4)}</Td>
              <Td className="break-all">{b.miner}</Td>
              <Td>{fmtNum(b.reward, 8)}</Td>
              <Td><code className="text-xs">{short(b.hash, 18)}</code></Td>
              <Td>{fmtISO(b.created)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
