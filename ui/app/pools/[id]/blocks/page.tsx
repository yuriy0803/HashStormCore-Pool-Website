// ui/app/pools/[id]/blocks/page.tsx
import { api } from "@/lib/api";
import { Table, Th, Td } from "@/components/Table";
import { tServer } from "@/i18n/server";
import Link from "next/link";
import LocalTime from "@/components/LocalTime";

export const revalidate = 0; // Disable caching for live data
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function PoolBlocks({
  params,
}: {
  params: { id: string };
}) {
  const tPool = tServer("Pool");

  // Fetch pool info
  const pool = await api.getPool(params.id);
  if (!pool)
    return (
      <div className="text-[var(--muted)]">
        Pool not found.
      </div>
    );

  // Fetch last blocks for this pool (API already normalizes date to ISO)
  const { blocks } = await api.listPoolBlocks(pool.id, 1, PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Blocks - {pool.id}
        </h1>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>{tPool("table.height") ?? "Height"}</Th>
            <Th>{tPool("table.hash") ?? "Hash"}</Th>
            <Th>{tPool("table.date") ?? "Date"}</Th>
            <Th>{tPool("table.status") ?? "Status"}</Th>
          </tr>
        </thead>

        <tbody>
          {!blocks || blocks.length === 0 ? (
            <tr>
              <Td
                colSpan={4}
                className="text-center py-6 text-sm opacity-70"
              >
                {tPool("empty.blocks") ?? "No blocks to show yet."}
              </Td>
            </tr>
          ) : (
            blocks.map((b: any, i: number) => (
              <tr key={`${b.hash ?? ""}${b.blockHeight ?? i}`}>
                <Td suppressHydrationWarning>
                  {b.blockHeight != null ? `#${b.blockHeight}` : "-"}
                </Td>

                <Td className="truncate max-w-[420px]">
                  {b.hash ? (
                    <Link
                      href={`/pools/${pool.id}/blocks`}
                      className="underline hover:text-[var(--primary)] transition-colors"
                    >
                      {b.hash}
                    </Link>
                  ) : (
                    "-"
                  )}
                </Td>

                <Td suppressHydrationWarning>
                  <LocalTime
                    iso={b.created} fallback="-"
                  />
                </Td>

                <Td>{b.status ?? "-"}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
