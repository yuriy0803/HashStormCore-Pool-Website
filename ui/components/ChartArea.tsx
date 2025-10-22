// ui/components/ChartArea.tsx

"use client";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

function fmtHashrateLocal(v?: number) {
  if (!v) return "0 H/s";
  const u = ["H/s","kH/s","MH/s","GH/s","TH/s","PH/s"];
  let i=0, val=Number(v);
  while (val >= 1000 && i < u.length-1) { val/=1000; i++; }
  return `${val.toFixed(2)} ${u[i]}`;
}
function fmtNumLocal(v?: number, maxFrac = 2) {
  if (v == null) return "—";
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export default function ChartArea({
  data, xKey, yKey,
  yFormat = "number", // "hashrate" | "number"
  maxFrac = 2
}: {
  data: any[];
  xKey: string;
  yKey: string;
  yFormat?: "hashrate" | "number";
  maxFrac?: number;
}) {
  const format = (v: number) =>
    yFormat === "hashrate" ? fmtHashrateLocal(v) : fmtNumLocal(v, maxFrac);

  return (
    <div className="rounded-2xl bg-card border border-edge p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="currentColor" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08}/>
          <XAxis dataKey={xKey} tick={{ fill: "currentColor", opacity: 0.6 }}/>
          <YAxis tick={{ fill: "currentColor", opacity: 0.6 }} tickFormatter={format}/>
          <Tooltip
            contentStyle={{ background: "#10161e", border: "1px solid #1a2230", borderRadius: 12 }}
            labelStyle={{ color: "#9fb0c3" }}
            formatter={(v) => format(Number(v))}
          />
          <Area type="monotone" dataKey={yKey} stroke="currentColor" fill="url(#g1)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
