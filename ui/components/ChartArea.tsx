// ui/components/ChartArea.tsx
"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtHashrateUnit, fmtNum } from "@/lib/format";

type Props = {
  data: any[];
  xKey: string;
  yKey: string;
  yFormat?: "hashrate" | "number";
  unit?: "H/s" | "Sol/s";
  maxFrac?: number;
  stepMinutes?: number;
  labelEvery?: number;
  carryForward?: boolean;
};

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

export default function ChartArea({
  data,
  xKey,
  yKey,
  yFormat = "hashrate",
  unit = "H/s",
  maxFrac = 2,
  stepMinutes = 30,
  labelEvery = 60,
  carryForward = true,
}: Props) {
  const formatY = (v: number) =>
    yFormat === "hashrate" ? fmtHashrateUnit(v, unit) : fmtNum(v, maxFrac);

  const { series, xTicks } = useMemo(() => {
    const STEP = stepMinutes * 60 * 1000;

    const raw = (data ?? [])
      .map((d) => {
        const t0 = new Date(d?.[xKey]).getTime();
        if (!Number.isFinite(t0)) return null;
        const t = t0 - (t0 % STEP);
        const v = Number(d?.[yKey]);
        return { t, v: Number.isFinite(v) ? v : null };
      })
      .filter(Boolean) as { t: number; v: number | null }[];

    if (raw.length === 0) return { series: [], xTicks: [] as number[] };

    const byT = new Map<number, number | null>();
    for (const { t, v } of raw) byT.set(t, v);

    const start = Math.min(...raw.map((d) => d.t));
    const end = Math.max(...raw.map((d) => d.t));

    const ticks: number[] = [];
    for (let t = start - (start % STEP); t <= end; t += STEP) ticks.push(t);

    let last: number | null = null;
    const out = ticks.map((t) => {
      const v = byT.has(t) ? (byT.get(t) as number | null) : null;
      if (v != null) last = v;
      return { [xKey]: t, [yKey]: carryForward ? last : v } as Record<
        string,
        number | null
      >;
    });

    return { series: out, xTicks: ticks };
  }, [data, xKey, yKey, stepMinutes, carryForward]);

  return (
    <div className="rounded-2xl bg-card border border-edge p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.6} />
              <stop offset="95%" stopColor="currentColor" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />

          <XAxis
            dataKey={xKey}
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={xTicks}
            interval={0}
            minTickGap={0}
            tick={({ x, y, payload }) => {
              const ms = Number(payload.value);
              const m = new Date(ms).getMinutes();
              const show = labelEvery > 0 ? m % labelEvery === 0 : true;
              return (
                <text
                  x={x}
                  y={y! + 14}
                  textAnchor="middle"
                  fill="currentColor"
                  opacity={0.6}
                  fontSize={12}
                >
                  {show ? timeFmt.format(new Date(ms)) : ""}
                </text>
              );
            }}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{ background: "#10161e", border: "1px solid #1a2230", borderRadius: 12 }}
            labelStyle={{ color: "#9fb0c3" }}
            labelFormatter={(label) => timeFmt.format(new Date(Number(label)))}
            formatter={(v: any) => formatY(Number(v))}
          />

          <YAxis
            tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
            tickFormatter={formatY}
          />

          <Area
            type="monotone"
            dataKey={yKey}
            stroke="currentColor"
            fill="url(#g1)"
            dot={false}
            connectNulls={!carryForward}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
