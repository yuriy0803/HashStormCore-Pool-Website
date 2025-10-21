import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import Stat from "@/components/Stat";
import ChartArea from "@/components/ChartArea";
import { fmtHashrate, fmtNum, fmtISO } from "@/lib/format";

export default async function MinerDetailPage({ params }: { params: { id: string; address: string }}) {
  const detail = await api.getMinerInPool(params.id, params.address);
  const perf = await api.getMinerPerformance(params.id, params.address);

  // build time-series by summing workers
  const data = perf.map(p => {
    const totalHash = Object.values(p.workers || {}).reduce((s,w)=> s+(w.hashrate||0), 0);
    return { t: new Date(p.created).toLocaleTimeString(), hashrate: totalHash };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold break-all">{params.address}</h1>

      <div className="grid grid-cols-5 gap-3">
        <Stat label="Pending shares" value={fmtNum(detail.pendingShares, 4)} />
        <Stat label="Pending balance" value={fmtNum(detail.pendingBalance, 8)} />
        <Stat label="Total paid" value={fmtNum(detail.totalPaid, 8)} />
        <Stat label="Today paid" value={fmtNum(detail.todayPaid, 8)} />
        <Stat label="Miner effort" value={fmtNum(detail.minerEffort, 4)} />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Hashrate (History)</h2>
        <ChartArea data={data} xKey="t" yKey="hashrate" yFormat="hashrate" />
      </section>

      {detail.performance && (
        <section className="space-y-3">
          <h2 className="font-semibold">Workers (snapshot {fmtISO(detail.performance.created)})</h2>
          <Table>
            <thead><tr><Th>Worker</Th><Th>Hashrate</Th><Th>Shares/s</Th></tr></thead>
            <tbody>
              {Object.entries(detail.performance.workers || {}).map(([w,v])=>(
                <tr key={w}>
                  <Td>{w}</Td>
                  <Td>{fmtHashrate(v.hashrate)}</Td>
                  <Td>{fmtNum(v.sharesPerSecond, 4)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      )}
    </div>
  );
}
