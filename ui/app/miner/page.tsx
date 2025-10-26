// ui/app/miner/page.tsx
import Link from "next/link";

export const revalidate = 0;

export default function MinerLookupPage({
  searchParams,
}: {
  searchParams?: { address?: string; notfound?: string };
}) {
  const address = (searchParams?.address || "").trim();
  const notfound = searchParams?.notfound === "1";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Miner Lookup</h1>
      {address ? (
        notfound ? (
          <div className="rounded border p-4 bg-yellow-50">
            <p className="mb-2">No miner found for address:</p>
            <code className="px-2 py-1 bg-white border rounded">{address}</code>
            <p className="mt-3">Tip: make sure you typed the full address. If the miner is offline for long, it may not appear.</p>
          </div>
        ) : (
          <div className="rounded border p-4 bg-blue-50">
            <p>Searching miner <code className="px-2 py-1 bg-white border rounded">{address}</code>…</p>
            <p className="mt-2">You should be redirected automatically from the header search.</p>
          </div>
        )
      ) : (
        <div className="rounded border p-4">
          <p>Use the header search to find a miner by address.</p>
          <p className="mt-2">
            Go to <Link href="/allpools" className="underline">Pools</Link> to browse miners by pool.
          </p>
        </div>
      )}
    </main>
  );
}
