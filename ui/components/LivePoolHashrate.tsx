"use client";
import { useEffect, useState } from "react";
import { fmtHashrateUnit } from "@/lib/format";
import { api } from "@/lib/api";

type Props = { poolId: string; unit: "H/s" | "Sol/s"; initial?: number };

export default function LivePoolHashrate({ poolId, unit, initial = 0 }: Props) {
    const [val, setVal] = useState<number>(initial);

    async function tick() {
        try {
            const j = await api.poolSnapshot(poolId);
            const v = Number(j?.currentHashrate ?? j?.poolHashrate ?? j?.hashrate ?? 0);
            if (Number.isFinite(v)) setVal(v);
        } catch { }
    }

    useEffect(() => {
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [poolId]);

    return <>{fmtHashrateUnit(val, unit)}</>;
}
