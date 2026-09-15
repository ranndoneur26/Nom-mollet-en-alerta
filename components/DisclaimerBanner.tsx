"use client";
import { useDictionary } from "@/lib/i18n/dictionary-context";

export function DisclaimerBanner() {
  const { dict } = useDictionary();
  return (
    <div className="disclaimer" dangerouslySetInnerHTML={{ __html: dict.disclaimer }} />
  );
}
