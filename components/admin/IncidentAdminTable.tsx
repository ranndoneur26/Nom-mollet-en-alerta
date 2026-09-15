"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import { StatusPill } from "@/components/StatusPill";
import type { IncidentStatus } from "@/types/database.types";

const ALL_STATUSES: IncidentStatus[] = [
  "moderacio", "pendent", "estudi", "assignada", "tramitacio", "resolta", "tancada", "fora", "duplicada", "rebutjada",
];

interface Row { id: string; public_id: string; title: string; status: IncidentStatus; neighborhoods: { name: string } | null }

export function IncidentAdminTable({ rows }: { rows: Row[] }) {
  const { dict } = useDictionary();
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function changeStatus(id: string, status: IncidentStatus) {
    setBusy(id);
    await supabase.from("incidents").update({ status }).eq("id", id);
    setBusy(null);
    router.refresh();
  }

  async function merge(sourceId: string, targetId: string) {
    if (!targetId) return;
    if (!confirm(dict.detail.mergedInto + "?")) return;
    setBusy(sourceId);
    const { error } = await supabase.rpc("merge_incidents", { p_source: sourceId, p_target: targetId });
    setBusy(null);
    if (error) alert(error.message);
    router.refresh();
  }

  function exportCsv() {
    const cols = ["public_id", "title", "status"];
    const csv = [cols.join(",")].concat(rows.map((r) => cols.map((c) => JSON.stringify((r as any)[c] ?? "")).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mollet-en-alerta-incidencies.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <button className="btn btn-sm btn-outline" onClick={exportCsv} style={{ marginBottom: 12 }}>⬇ CSV</button>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>ID</th>
            <th style={{ textAlign: "left", padding: 8 }}>Títol</th>
            <th style={{ textAlign: "left", padding: 8 }}>{dict.filters.status}</th>
            <th style={{ textAlign: "left", padding: 8 }}>{dict.filters.neighborhood}</th>
            <th style={{ textAlign: "left", padding: 8 }}>Canviar estat</th>
            <th style={{ textAlign: "left", padding: 8 }}>Fusionar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{r.public_id}</td>
              <td style={{ padding: 8 }}>{r.title}</td>
              <td style={{ padding: 8 }}><StatusPill status={r.status} dict={dict} /></td>
              <td style={{ padding: 8 }}>{r.neighborhoods?.name ?? "—"}</td>
              <td style={{ padding: 8 }}>
                <select disabled={busy === r.id} defaultValue={r.status} onChange={(e) => changeStatus(r.id, e.target.value as IncidentStatus)}>
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{dict.status[s]}</option>)}
                </select>
              </td>
              <td style={{ padding: 8 }}>
                <select disabled={busy === r.id} defaultValue="" onChange={(e) => merge(r.id, e.target.value)}>
                  <option value="">{dict.detail.mergedInto}…</option>
                  {rows.filter((o) => o.id !== r.id).map((o) => <option key={o.id} value={o.id}>{o.public_id} — {o.title}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
