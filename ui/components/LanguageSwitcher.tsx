"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useT, useLang } from "@/i18n/client";

type LangCode = "en" | "pt";
type Opt = { code: LangCode; flagCountry: "us" | "pt" };

const OPTIONS: Opt[] = [
  { code: "en", flagCountry: "us" },
  { code: "pt", flagCountry: "pt" }
];

const NAME_KEY: Record<LangCode, "english" | "portuguese"> = {
  en: "english",
  pt: "portuguese"
};

function Flag({ country, size = 16 }: { country: string; size?: number }) {
  return <span className={`fi fi-${country}`} style={{ fontSize: size }} />;
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const lang = useLang();
  const t = useT("Header");

  const current = useMemo(
    () => OPTIONS.find(o => o.code === lang) ?? OPTIONS[0],
    [lang]
  );

  function setLang(code: LangCode) {
    document.cookie = `lang=${code}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl border border-edge px-3 py-2 hover:bg-card/60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* usar country, não code */}
        <Flag country={current.flagCountry} />
        <span className="text-sm">{t(NAME_KEY[lang])}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70" aria-hidden="true">
          <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-edge bg-bg shadow-lg"
        >
          {OPTIONS.map(o => (
            <li key={o.code}>
              <button
                role="option"
                onClick={() => setLang(o.code)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-card/60"
              >
                {/* usar country, não code */}
                <Flag country={o.flagCountry} />
                <span className="text-sm">{t(NAME_KEY[o.code])}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
