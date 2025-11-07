// ui/components/MiningCommand.tsx
"use client";

import * as React from "react";

type Port = { port: string; tls: boolean; diff?: number };

const MINERS = [
  { id: "GMINER", label: "GMiner" },
  { id: "MINIZ", label: "miniZ" },
  { id: "LOL", label: "lolMiner" },
];

export default function MiningCommand({
  coinSymbol,
  algo,
  domainForCoin,
  ports,
  defaultMiner = "GMINER",
  onCopy,
}: {
  coinSymbol?: string | null;
  algo?: string | null;
  domainForCoin?: string;
  ports: Port[];
  defaultMiner?: "GMINER" | "MINIZ" | "LOL";
  onCopy?: () => void;
}) {
  // ---- state ----
  const [miner, setMiner] = React.useState<"GMINER" | "MINIZ" | "LOL">(defaultMiner);
  const [portIdx, setPortIdx] = React.useState(0);

  // ---- choose best port (TLS first, then lowest) ----
  const sortedPorts = React.useMemo(() => {
    const arr = [...(ports || [])];
    arr.sort((a, b) => {
      if (a.tls && !b.tls) return -1;
      if (!a.tls && b.tls) return 1;
      return Number(a.port) - Number(b.port);
    });
    return arr;
  }, [ports]);

  React.useEffect(() => {
    // reset index if ports list changes
    setPortIdx(0);
  }, [sortedPorts.map(p => `${p.tls}-${p.port}-${p.diff ?? ""}`).join("|")]);

  const p = sortedPorts[portIdx] ?? sortedPorts[0] ?? { port: "3052", tls: true };

  const host =
    domainForCoin ||
    `${String(coinSymbol ?? "").toLowerCase()}.hashstorm.org`;
  const scheme = p.tls ? "ssl" : "tcp";
  const url = `stratum+${scheme}://${host}:${p.port}`;

  const WALLET = "<WALLET_ADDRESS>";
  const WORKER = "<RIG_NAME>";
  const PASS = "x";

  // ---- algo normalization per miner (mantém simples) ----
  const algoLc = String(algo ?? "equihash").toLowerCase();

  let cmd = "";
  switch (miner) {
    case "GMINER":
      // GMiner
      cmd = `miner --algo ${algoLc} --server ${host} --port ${p.port} --ssl ${p.tls ? "1" : "0"} --user ${WALLET}.${WORKER} --pass ${PASS}`;
      break;
    case "MINIZ":
      // miniZ
      cmd = `miniZ --algo=${algoLc} --url=${url} --user=${WALLET}.${WORKER} --pass=${PASS}`;
      break;
    case "LOL":
      // lolMiner
      cmd = `lolMiner --algo ${algoLc} --pool ${url} --user ${WALLET}.${WORKER} --pass ${PASS}`;
      break;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-sub">Mining Software</label>
        <select
          className="rounded-xl bg-card border border-edge px-3 py-2"
          value={miner}
          onChange={(e) => setMiner(e.target.value as any)}
        >
          {MINERS.map((m) => (
            <option key={m.id} value={m.id as any}>
              {m.label}
            </option>
          ))}
        </select>

        <label className="ml-3 text-sm text-sub">Port</label>
        <select
          className="rounded-xl bg-card border border-edge px-3 py-2"
          value={String(portIdx)}
          onChange={(e) => setPortIdx(parseInt(e.target.value, 10))}
        >
          {sortedPorts.length === 0 ? (
            <option value="0">No ports</option>
          ) : (
            sortedPorts.map((pp, i) => (
              <option key={`${pp.port}-${i}`} value={i}>
                {pp.tls ? "SSL" : "TCP"} • {pp.port}
                {pp.diff ? ` • diff ${pp.diff}` : ""}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <pre className="flex-1 rounded-xl border border-edge bg-zinc-900/50 p-3 text-xs overflow-x-auto">
{cmd}
        </pre>
        <button
          className="shrink-0 rounded-xl bg-accent/20 border border-accent/40 px-3 py-2 hover:bg-accent/30"
          onClick={() => {
            navigator.clipboard?.writeText(cmd).catch(() => {});
            onCopy?.();
          }}
        >
          Copy
        </button>
      </div>

      <div className="text-xs text-sub">
        Username = <code>{WALLET}.{WORKER}</code> • Password = <code>{PASS}</code> • URL = <code>{url}</code>
      </div>
    </div>
  );
}
