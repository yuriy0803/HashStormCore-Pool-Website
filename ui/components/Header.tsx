"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "@/i18n/client";
import Brand from "@/components/Brand";


/************** IGNORE THIS, STYLING ATEMPTS MADE BEFORE FINDING THE PERFECT FIT **************/
// rounded-xl border-edge/0 px-5 py-2 hover:border-accent/40 hover:font-bold

/**
 relative px-5 py-2 rounded-xl border border-transparent text-base font-medium 
              hover:font-bold transition-all duration-150
              before:absolute before:inset-0 before:border before:border-transparent hover:before:border-accent/40
              before:rounded-xl before:transition-colors before:duration-150
 */

/**

"rounded-xl px-5 py-2 border font-semibold " +
"border-transparent " +
"hover:border-accent/40 hover:bg-accent/10 " +
"focus:outline-none focus:ring-2 focus:ring-accent/40";
 */

/*******************************************************************************************/


function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group relative inline-block rounded-xl border border-transparent px-5 py-2
                 before:absolute before:inset-0 before:rounded-xl before:border before:border-transparent
                 hover:before:border-accent/0 focus:outline-none focus:ring-2 focus:ring-accent/0"
    >
      {/* invisible ghost (regular space alloc) */}
      <span className="invisible font-normal block">{children}</span>

      {/* real text: starts bold and relaxes to regulate on hover */}
      <span
        className="absolute inset-0 flex items-center justify-center
                   font-bold group-hover:font-normal transition-[font-weight] duration-75 ease-in-out"
      >
        {children}
      </span>
    </Link>
  );
}



export default function Header() {
  const [addr, setAddr] = useState("");
  const router = useRouter();
  const tC = useT("Common");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = addr.trim();
    if (!a) return;

    try {
      const r = await fetch(`/api/pools`, { cache: "no-store" });
      const data = await r.json();
      const all = data?.pools ?? [];

      for (const pool of all) {
        try {
          const res = await fetch(`/api/pools/${encodeURIComponent(pool.id)}/miners/${encodeURIComponent(a)}`, { cache: "no-store" });
          if (res.ok) {
            router.push(`/pools/${encodeURIComponent(pool.id)}/miners/${encodeURIComponent(a)}`);
            return;
          }
        } catch { }
      }
      router.push(`/miner?address=${encodeURIComponent(a)}&notfound=1`);
    } catch {
      router.push(`/miner?address=${encodeURIComponent(a)}&error=fetch`);
    }
  }

  return (
    <header className="border-b border-edge sticky top-0 z-50 bg-bg/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        

        {/* NAV à esquerda, com espaçador flex para a search não saltar */}
        <nav className="inline-flex items-center gap-2">
          <Brand withText size={48} textClassName="font-semibold text-2xl" href="/" />
          <NavLink href="/allpools">Pools</NavLink>
          <NavLink href="/getting-started">Getting Started</NavLink>
        </nav>

        {/* empurra a search para a direita sem o nav se mexer */}
        <div className="flex-1" />

        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            id="wallet"
            name="wallet"
            className="rounded-xl bg-card border border-edge px-3 py-2 w-56"
            placeholder={`${tC("walletAddress")}...`}
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-accent/20 border border-accent/40 px-4 py-2 hover:bg-accent/30 disabled:opacity-50"
            disabled={!addr.trim()}
          >
            {tC("search")}
          </button>
        </form>

        <div className="ml-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
