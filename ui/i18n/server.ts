import {cookies, headers} from "next/headers";
import en from "./messages/en";
import pt from "./messages/pt";

const MAP = { en, pt };
export type Lang = keyof typeof MAP;

export function getLang(): Lang {
  const c = cookies().get("lang")?.value as Lang | undefined;
  if (c && MAP[c]) return c;
  // tenta header Accept-Language
  const al = headers().get("accept-language") || "";
  if (al.toLowerCase().startsWith("pt")) return "pt";
  return "en";
}

export function getMessages() {
  return MAP[getLang()];
}

// t para Server Components
export function tServer<N extends keyof typeof MAP["en"] & string>(ns: N) {
  const dict = getMessages()[ns] as Record<string, any>;
  return (key: string, vars?: Record<string, string | number>) => {
    let s = (dict?.[key] ?? key) as string;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return s;
  };
}
