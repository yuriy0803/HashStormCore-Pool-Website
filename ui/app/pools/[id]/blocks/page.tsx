// ui/app/pools/[id]/blocks/page.tsx
import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import { fmtNum, fmtISO, short } from "@/lib/format";
import { tServer } from "@/i18n/server";

export const revalidate = 0;

export default async function PoolBlocks({ params }: { params: { id: string }}) {
  const tPool = tServer("Pool");
  const blocks = await api.listPoolBlocks(params.id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Blocks - {params.id}</h1>
      <Table>
        <thead>
          <tr>
            <Th>{tPool("table.height")}</Th>
            <Th>{tPool("table.status")}</Th>
            <Th>{tPool("table.efficiency")}</Th>
            <Th>{tPool("table.miner")}</Th>
            <Th>{tPool("table.amount")}</Th>
            <Th>{tPool("table.hash")}</Th>
            <Th>{tPool("table.date")}</Th>
          </tr>
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
