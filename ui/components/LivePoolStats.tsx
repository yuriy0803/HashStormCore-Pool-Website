// ui/components/LivePoolStats.tsx
"use client";

import { useEffect, useState } from "react";
import Stat from "@/components/Stat";
import { fmtHashrateUnit, fmtNum } from "@/lib/format";
import { api, LIVE_WINDOW_SEC } from "@/lib/api";
import { subscribeLiveTicker } from "@/lib/liveTicker";

type Unit = "H/s" | "Sol/s";

type Snapshot = {
    unit?: Unit;
    currentHashrate?: number;
    minersOnline?: number;
    network?: { hashrate?: number; difficulty?: number };
};

export default function LivePoolStats({
    poolId,
    unit = "H/s",
    initial,
}: {
    poolId: string;
    unit?: Unit;
    initial?: Snapshot; // initial SSR snapshot
}) {
    const [u, setU] = useState<Unit>(initial?.unit ?? unit);
    const [poolHashrate, setPoolHashrate] = useState<number>(Number(initial?.currentHashrate ?? 0));
    const [minersOnline, setMinersOnline] = useState<number>(Number(initial?.minersOnline ?? 0));
    const [netHash, setNetHash] = useState<number>(Number(initial?.network?.hashrate ?? 0));
    const [netDiff, setNetDiff] = useState<number>(Number(initial?.network?.difficulty ?? 0));

    async function load() {
        try {
            const s = await api.poolSnapshot(poolId);
            const unitFromApi = s?.unit === "Sol/s" || s?.unit === "H/s" ? s.unit : undefined;
            if (unitFromApi && unitFromApi !== u) setU(unitFromApi);

            const ph = Number(s?.currentHashrate ?? s?.poolHashrate ?? s?.hashrate ?? 0);
            if (Number.isFinite(ph)) setPoolHashrate(ph);
            if (Number.isFinite(s?.minersOnline)) setMinersOnline(Number(s.minersOnline));
            if (Number.isFinite(s?.network?.hashrate)) setNetHash(Number(s.network.hashrate));
            if (Number.isFinite(s?.network?.difficulty)) setNetDiff(Number(s.network.difficulty));
        } catch { }
    }

    useEffect(() => {
        const off = subscribeLiveTicker(load); // sincronizado com o resto
        load(); // primeira carga já
        return () => off();
    }, [poolId]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat label="Pool Hashrate" value={fmtHashrateUnit(poolHashrate, u)} />
            <Stat label="Network Hashrate" value={fmtHashrateUnit(netHash, u)} />
            <Stat label="Network Difficulty" value={fmtNum(netDiff, 2)} />
            <Stat label="Miners Online" value={fmtNum(minersOnline, 0)} />
        </div>
    );
}
