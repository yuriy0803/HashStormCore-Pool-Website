// ui/app/api/miner-lookup/route.ts
import { NextRequest, NextResponse } from "next/server";

// Server-only base. DANGER Do not use NEXT_PUBLIC here.
const BASE = (process.env.MININGCORE_INTERNAL_API_URL || "").replace(/\/$/, "");
const TIMEOUT_MS = 3500;

/** GET /api/miner-lookup?address=...  -> { found: boolean, poolId?: string } */
export async function GET(req: NextRequest) {
    try {
        const address = req.nextUrl.searchParams.get("address")?.trim();
        if (!address) {
            return NextResponse.json({ error: "address required" }, { status: 400 });
        }
        if (!BASE) {
            return NextResponse.json({ error: "MININGCORE_INTERNAL_API_URL not set" }, { status: 500 });
        }

        // Fetch pools
        const poolsRes = await fetch(`${BASE}/pools`, { cache: "no-store" });
        if (!poolsRes.ok) {
            return NextResponse.json({ error: "pool list error" }, { status: 502 });
        }
        const pools = (await poolsRes.json())?.pools ?? [];
        if (!Array.isArray(pools) || pools.length === 0) {
            return NextResponse.json({ found: false });
        }

        // Concurrency + timeout to avoid hanging
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort("timeout"), TIMEOUT_MS);

        const checks = await Promise.allSettled(
            pools.map(async (p: any) => {
                const r = await fetch(
                    `${BASE}/pools/${encodeURIComponent(p.id)}/miners/${encodeURIComponent(address)}`,
                    { cache: "no-store", signal: ac.signal }
                );
                return r.ok ? p.id : null;
            })
        );

        clearTimeout(to);

        const hit = checks.find(x => x.status === "fulfilled" && (x as any).value);
        if (hit && (hit as any).value) {
            return NextResponse.json({ found: true, poolId: (hit as any).value as string });
        }
        return NextResponse.json({ found: false });
    } catch {
        // On errors (timeout/abort/etc) return not found to keep UX snappy
        return NextResponse.json({ found: false });
    }
}
