// ui/app/pools/[id]/blocks/page.tsx
import { api, fmtIsoToLocal } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import { tServer } from "@/i18n/server";
import Link from "next/link";
import { fmtNum } from "@/lib/format";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type SearchParams = { [k: string]: string | string[] | undefined };

function intParam(v: string | string[] | undefined, fallback = 1) {
  const n = Array.isArray(v) ? v[0] : v;
  const x = Number.parseInt(String(n ?? "")) || fallback;
  return Math.max(1, x);
}
function sizeParam(v: string | string[] | undefined, fallback = 20) {
  const n = intParam(v, fallback);
  return [10, 25, 50].includes(n) ? n : fallback;
}

// ===== Explorer helpers =====
const EXPLORER_BASE_BY_SYMBOL: Record<string, string> = {
  BTCZ: "https://explorer.btcz.rocks",
  // adiciona aqui outras coins quando precisares
};

function inferExplorerBaseFromAddressLink(link?: string | null): string | null {
  if (!link) return null;
  try {
    // exemplos válidos:
    // https://explorer.btcz.rocks/address/t1JrE6...
    // https://explorer.btcz.rocks/#/address/t1JrE6...   (alguns têm #/)
    const u = new URL(link);
    const path = u.pathname; // ex: /address/xxxx  ou /#/address/xxxx (pathname fica "/" e o resto em hash)
    const hashPath = u.hash?.replace(/^#/, "") || ""; // ex: /address/xxxx

    const p = path.includes("/address/") ? path : hashPath;
    const idx = p.indexOf("/address/");
    if (idx >= 0) {
      const basePath = p.slice(0, idx); // "" ou "/"
      u.pathname = basePath || "/";
      u.hash = ""; // limpar hash para termos URL limpo
      return u.toString().replace(/\/+$/, ""); // sem trailing slash
    }
    // fallback: se não encontrar /address/, devolve origem
    return u.origin;
  } catch {
    return null;
  }
}

function makeExplorerLinks(pool: any) {
  const sym = String(pool?.coin?.symbol || "").toUpperCase();
  const fallbackBase = EXPLORER_BASE_BY_SYMBOL[sym] || null;
  const inferredBase = inferExplorerBaseFromAddressLink(pool?.addressInfoLink);
  const base = inferredBase || fallbackBase || null;

  return {
    blockUrl: (hash?: string | null) =>
      base && hash ? `${base}/block/${hash}` : undefined,
    addressUrl: (addr?: string | null) =>
      base && addr ? `${base}/address/${addr}` : undefined,
  };
}

// visual compactor for long ids (e.g., hashes, addresses)
function shortMid(s: string, n = 6) {
  if (!s) return s;
  if (s.length <= n * 2 + 3) return s;
  return `${s.slice(0, n)}…${s.slice(-n)}`;
}

export default async function PoolBlocks({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const tPool = tServer("Pool");

  const page = intParam(searchParams?.page, 1);
  const pageSize = sizeParam(searchParams?.per, 20);

  const pool = await api.getPool(params.id);
  if (!pool) return <div className="text-[var(--muted)]">Pool not found.</div>;

  const resp = await api.listPoolBlocks(pool.id, page, pageSize);
  const blocks: any[] = Array.isArray(resp?.blocks) ? resp.blocks : [];
  const total = Number(resp?.total ?? 0);

  const hasPrev = page > 1;
  const hasNext = page * pageSize < total;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {tPool("links.blocks") ?? "Blocos"} – {pool.id}
        </h1>
        <div className="text-sm text-sub">
          Showing {blocks.length > 0 ? (page - 1) * pageSize + 1 : 0}-
          {(page - 1) * pageSize + blocks.length} of {total}
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <Th className="w-24">{tPool("table.height") ?? "Altura"}</Th>
            <Th className="w-[280px]">Hash</Th>
            <Th className="w-40">{tPool("table.date") ?? "Data"}</Th>
            <Th className="w-[280px]">{tPool("table.miner") ?? "Miner"}</Th>
            <Th className="text-right w-28">Miner Effort</Th>
            <Th className="text-right w-28">Pool Effort</Th>
            <Th className="text-right w-20">Diff</Th>
            <Th className="text-right w-24">Reward</Th>
            <Th className="w-24">{tPool("table.status") ?? "Estado"}</Th>
          </tr>
        </thead>

        <tbody>
          {blocks.length === 0 ? (
            <tr>
              <Td colSpan={9} className="text-center py-6 text-sm opacity-70">
                {tPool("empty.blocks") ?? "No blocks to show yet."}
              </Td>
            </tr>
          ) : (
            blocks.map((b: any, i: number) => {
              const height = b.blockHeight ?? b.blockheight ?? b.height ?? null;
              const hash = b.hash ?? b.transactionConfirmationData ?? null;
              const miner = b.miner ?? b.address ?? null;
              const createdIso = b.created ?? b.createdAt ?? b.time ?? null;

              const minerEffort = Number(b.minerEffort ?? b.miner_effort ?? 0);
              const poolEffort = Number(b.effort ?? b.poolEffort ?? 0);
              const diff = Number(b.networkDifficulty ?? b.difficulty ?? 0);
              const reward = Number(b.reward ?? 0);
              const status = b.status ?? "-";

              return (
                <tr key={`${hash ?? ""}-${height ?? i}`}>
                  <Td className="whitespace-nowrap">
                    {height != null ? `#${height}` : "-"}
                  </Td>

                  <Td className="max-w-[280px]">
                    {hash ? (
                      <Link
                        href={`/pools/${pool.id}/blocks`}
                        className="underline hover:text-[var(--primary)] transition-colors font-mono text-xs md:text-sm"
                        title={hash}
                      >
                        {shortMid(hash, 6)}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </Td>

                  <Td suppressHydrationWarning className="whitespace-nowrap">
                    {fmtIsoToLocal(createdIso, true) || "-"}
                  </Td>

                  <Td className="max-w-[280px]">
                    {miner ? (
                      <Link
                        className="underline font-mono text-xs md:text-sm"
                        href={`/pools/${pool.id}/miners/${miner}`}
                        title={miner}
                      >
                        {shortMid(miner, 6)}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </Td>

                  <Td className="text-right">{minerEffort ? fmtNum(minerEffort*100)+"%" : "NaN"}</Td>
                  <Td className="text-right">{poolEffort ? fmtNum(poolEffort*100)+"%" : "NaN"}</Td>
                  <Td className="text-right">{fmtNum(diff, 2)}</Td>
                  <Td className="text-right">{reward}</Td>
                  <Td className="whitespace-nowrap">{status}</Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <div className="flex items-center justify-between text-sm">
        <div>
          Page {page} &nbsp;•&nbsp; Per page:&nbsp;
          {[10, 25, 50].map((n) => (
            <Link
              key={n}
              className="underline mr-2"
              href={{
                pathname: `/pools/${pool.id}/blocks`,
                query: { page: 1, per: n },
              }}
            >
              {n}
            </Link>
          ))}
        </div>
        <div className="space-x-4">
          {hasPrev && (
            <Link
              className="underline"
              href={{
                pathname: `/pools/${pool.id}/blocks`,
                query: { page: page - 1, per: pageSize },
              }}
            >
              Prev
            </Link>
          )}
          {hasNext && (
            <Link
              className="underline"
              href={{
                pathname: `/pools/${pool.id}/blocks`,
                query: { page: page + 1, per: pageSize },
              }}
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
