import "server-only";
import ca from "./dictionaries/ca.json";
import es from "./dictionaries/es.json";

export const LOCALES = ["ca", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ca";

const dictionaries = { ca, es };

export function getDictionary(locale: string) {
  const l = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : DEFAULT_LOCALE;
  return dictionaries[l];
}

export type Dictionary = typeof ca;
