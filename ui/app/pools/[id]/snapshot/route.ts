import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const windowSec = req.nextUrl.searchParams.get("windowSec") ?? "600";
        const data = await api.poolSnapshot(params.id);

        return NextResponse.json(data ?? {}, { status: 200, headers: { "Cache-Control": "no-store" } });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "error" }, { status: 502 });
    }
}
