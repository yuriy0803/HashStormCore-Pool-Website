import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-edge sticky top-0 z-50 bg-bg/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="HashStorm" width={24} height={24}/>
          <span className="font-semibold">HashStorm</span>
        </Link>
        <nav className="flex items-center gap-4 text-sub">
          <Link href="/pools">Pools</Link>
          <Link href="/miner">Miner</Link>
        </nav>
        <div className="ml-auto text-sub text-sm">
          {/* TODO: live status, theme toggle, login do site */}
        </div>
      </div>
    </header>
  );
}
