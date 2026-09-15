"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface QueueItem { id: string; public_id: string; title: string; demo_author_alias: string | null; categories: { name: string } | null }

export function ModerationQueue({ items }: { items: QueueItem[] }) {
  const { dict } = useDictionary();
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "pendent" | "rebutjada" | "duplicada") {
    setBusy(id);
    await supabase.from("incidents").update({ status: action }).eq("id", id);
    setBusy(null);
    router.refresh();
  }

  if (!items.length) return <div style={{ color: "var(--gris-mig)", padding: "20px 0", textAlign: "center" }}>{dict.admin.noQueue}</div>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr><th style={{ textAlign: "left", padding: 8 }}>ID</th><th style={{ textAlign: "left", padding: 8 }}>Títol</th><th style={{ textAlign: "left", padding: 8 }}>Categoria</th><th style={{ textAlign: "left", padding: 8 }}>Autor</th><th style={{ padding: 8 }}></th></tr>
      </thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: 8 }}>{i.public_id}</td>
            <td style={{ padding: 8 }}>{i.title}</td>
            <td style={{ padding: 8 }}>{i.categories?.name}</td>
            <td style={{ padding: 8 }}>{i.demo_author_alias ?? "—"}</td>
            <td style={{ padding: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="btn btn-sm btn-primary" disabled={busy === i.id} onClick={() => act(i.id, "pendent")}>{dict.admin.approve}</button>
              <button className="btn btn-sm btn-ghost" disabled={busy === i.id} onClick={() => act(i.id, "rebutjada")}>{dict.admin.reject}</button>
              <button className="btn btn-sm btn-ghost" disabled={busy === i.id} onClick={() => act(i.id, "duplicada")}>{dict.admin.duplicate}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
