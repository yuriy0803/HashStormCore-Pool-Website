// ui/app/pools/[id]/performance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

// Revalidate aggressively in prod; live in dev.
export const revalidate = process.env.NODE_ENV === "development" ? 0 : 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raw = await api.getPoolPerformance(params.id);
    const compact = (raw ?? []).map((p: any) => ({
      t: new Date(p.created).toLocaleTimeString(),
      poolHashrate: p.poolHashrate ?? 0,
      miners: p.miners ?? undefined,
    }));
    return NextResponse.json(compact, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 502 });
  }
}
