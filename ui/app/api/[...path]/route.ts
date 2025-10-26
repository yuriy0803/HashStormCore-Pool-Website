// ui/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = (process.env.MININGCORE_INTERNAL_API_URL || "").replace(/\/+$/, "");

function buildUpstreamUrl(req: NextRequest, pathSegs: string[]) {
  const tail = pathSegs.join("/");
  const tailWithSlash = tail ? `/${tail}` : "";
  const base =
    UPSTREAM.endsWith("/api") && tail.startsWith("api")
      ? UPSTREAM.replace(/\/api$/, "")
      : UPSTREAM;
  const qs = req.nextUrl.search || "";
  return `${base}${tailWithSlash}${qs}`;
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  const url = buildUpstreamUrl(req, ctx.params.path || []);
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const text = await r.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      body = { ok: false, raw: text };
    }

    return NextResponse.json(body, {
      status: r.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e?.message || e),
        upstream: url,
        hint: "Verifica MININGCORE_INTERNAL_API_URL e se o daemon está ativo.",
      },
      { status: 502 }
    );
  }
}
