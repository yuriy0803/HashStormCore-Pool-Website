import { NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = (searchParams.get("key") || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  if (!key) return new Response("missing key", { status: 400 });

  const base = path.join(process.cwd(), "public", "coins");
  const candidates = [
    { file: path.join(base, `${key}.svg`), type: "image/svg+xml" },
    { file: path.join(base, `${key}.png`), type: "image/png" },
  ];

  for (const c of candidates) {
    try {
      const data = await fs.readFile(c.file);
      return new Response(data, {
        status: 200,
        headers: {
          "Content-Type": c.type,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
    }
  }

  return new Response(null, { status: 404 });
}
