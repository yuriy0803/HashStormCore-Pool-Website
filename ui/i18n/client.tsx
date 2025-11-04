// ui/i18n/client.tsx
"use client";

import {createContext, use, ReactNode, useMemo} from "react";

type Dict = Record<string, any>;
type Ctx = { lang: "en" | "pt"; messages: Dict };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({children, lang, messages}:{children: ReactNode; lang: "en"|"pt"; messages: Dict}) {
  const value = useMemo(()=>({lang, messages}), [lang, messages]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useLang() {
  const ctx = use(I18nCtx);
  if (!ctx) throw new Error("I18nProvider missing");
  return ctx.lang;
}

function getByPath(obj: Record<string, any>, path: string) {
  return path.split(".").reduce<any>((acc, key) => (acc?.[key]), obj);
}

export function useT<N extends string>(ns: N) {
  const ctx = use(I18nCtx);
  if (!ctx) throw new Error("I18nProvider missing");
  const dict = ctx.messages[ns] as Record<string, any>;
  return (key: string, vars?: Record<string, string | number>) => {
    let s = (getByPath(dict, key) ?? key) as string;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return s;
  };
}
