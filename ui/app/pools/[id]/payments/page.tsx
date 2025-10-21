import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import { fmtNum, fmtISO, short } from "@/lib/format";

export default async function PoolPayments({ params }: { params: { id: string }}) {
  const pays = await api.listPoolPayments(params.id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Payments - {params.id}</h1>
      <Table>
        <thead>
          <tr><Th>Address</Th><Th>Amount</Th><Th>TX</Th><Th>Data</Th></tr>
        </thead>
        <tbody>
          {pays.map((p,i) => (
            <tr key={`${p.transactionConfirmationData}-${i}`}>
              <Td><a className="underline" href={p.addressInfoLink} target="_blank">{p.address}</a></Td>
              <Td>{fmtNum(p.amount, 8)} {p.coin.toUpperCase()}</Td>
              <Td><a className="underline" href={p.transactionInfoLink} target="_blank"><code className="text-xs">{short(p.transactionConfirmationData, 18)}</code></a></Td>
              <Td>{fmtISO(p.created)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
