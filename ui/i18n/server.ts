// server.ts
import {cookies, headers} from "next/headers";
import en from "./messages/en";
import pt from "./messages/pt";

const MAP = { en, pt };
export type Lang = keyof typeof MAP;

export function getLang(): Lang {
  const c = cookies().get("lang")?.value as Lang | undefined;
  if (c && MAP[c]) return c;
  const al = headers().get("accept-language") || "";
  if (al.toLowerCase().startsWith("pt")) return "pt";
  return "en";
}

export function getMessages() {
  return MAP[getLang()];
}

function getByPath(obj: Record<string, any>, path: string) {
  return path.split(".").reduce<any>((acc, key) => (acc?.[key]), obj);
}

export function tServer<N extends keyof typeof MAP["en"] & string>(ns: N) {
  const dict = getMessages()[ns] as Record<string, any>;
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
