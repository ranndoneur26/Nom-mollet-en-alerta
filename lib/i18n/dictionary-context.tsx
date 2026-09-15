"use client";

import { createContext, useContext } from "react";
import type { Dictionary, Locale } from "./get-dictionary";

const DictionaryContext = createContext<{ dict: Dictionary; locale: Locale } | null>(null);

export function DictionaryProvider({
  dict,
  locale,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={{ dict, locale }}>
      {children}
    </DictionaryContext.Provider>
  );
}

/** Hook per usar les traduccions dins de Client Components. */
export function useDictionary() {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error("useDictionary() ha d'usar-se dins de <DictionaryProvider>");
  }
  return ctx;
}
