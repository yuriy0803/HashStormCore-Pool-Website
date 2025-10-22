// ui/app/pools/[id]/miners/[address]/page.tsx
import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import Stat from "@/components/Stat";
import ChartArea from "@/components/ChartArea";
import { fmtHashrate, fmtNum, fmtISO } from "@/lib/format";
import { tServer } from "@/i18n/server";

export const revalidate = 0;

export default async function MinerDetailPage({ params }: { params: { id: string; address: string }}) {
  const tStat = tServer("Stat");
  const tPool = tServer("Pool");

  const detail = await api.getMinerInPool(params.id, params.address);
  const perf = await api.getMinerPerformance(params.id, params.address);

  const data = perf.map(p => {
    const totalHash = Object.values(p.workers || {}).reduce((s:any,w:any)=> s+(w.hashrate||0), 0);
    return { t: new Date(p.created).toLocaleTimeString(), hashrate: totalHash };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold break-all">{params.address}</h1>

      <div className="grid grid-cols-5 gap-3">
        <Stat label={tStat("pendingShares")} value={fmtNum(detail.pendingShares, 4)} />
        <Stat label={tStat("pendingBalance")} value={fmtNum(detail.pendingBalance, 8)} />
        <Stat label={tStat("totalPaid")} value={fmtNum(detail.totalPaid, 8)} />
        <Stat label={tStat("todayPaid")} value={fmtNum(detail.todayPaid, 8)} />
        <Stat label={tStat("minerEffort")} value={fmtNum(detail.minerEffort, 4)} />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">{tPool("sections.hashrateHistory")}</h2>
        <ChartArea data={data} xKey="t" yKey="hashrate" yFormat="hashrate" />
      </section>

      {detail.performance && (
        <section className="space-y-3">
          <h2 className="font-semibold">{tPool("sections.workersSnapshot", { date: fmtISO(detail.performance.created) })}</h2>
          <Table>
            <thead><tr><Th>{tPool("table.worker")}</Th><Th>{tPool("table.hashrate")}</Th><Th>{tPool("table.sharesS")}</Th></tr></thead>
            <tbody>
              {Object.entries(detail.performance.workers || {}).map(([w,v]: any)=>(
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
