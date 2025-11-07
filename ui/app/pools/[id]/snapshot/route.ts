// ui/app/pools/[id]/snapshot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { api, LIVE_WINDOW_SEC } from "@/lib/api";

export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ws = Number(req.nextUrl.searchParams.get("windowSec") ?? LIVE_WINDOW_SEC);
        const data = await api.poolSnapshot(params.id, ws);
        return NextResponse.json(data ?? {}, { status: 200, headers: { "Cache-Control": "no-store" } });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "error" }, { status: 502 });
    }
}