"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapView } from "./MapViewLoader";
import { IncidentCard, type IncidentListItem } from "./IncidentCard";
import { FILTERABLE_STATUSES } from "@/lib/reference-data";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import type { IncidentStatus } from "@/types/database.types";

export function IncidentExplorer({
  incidents,
  categories,
  neighborhoods,
}: {
  incidents: (IncidentListItem & { latitude: number; longitude: number })[];
  categories: { id: number; name: string }[];
  neighborhoods: { id: string; name: string }[];
}) {
  const { dict, locale } = useDictionary();
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [statuses, setStatuses] = useState<Set<IncidentStatus>>(new Set());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");

  const filtered = useMemo(() => {
    let list = incidents;
    if (category) list = list.filter((i) => i.category_name === category);
    if (neighborhood) list = list.filter((i) => i.neighborhood_name === neighborhood);
    if (statuses.size) list = list.filter((i) => statuses.has(i.status));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.category_name ?? "").toLowerCase().includes(q) ||
          (i.neighborhood_name ?? "").toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "old") sorted.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (sort === "support") sorted.sort((a, b) => b.support_count - a.support_count);
    else sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return sorted;
  }, [incidents, category, neighborhood, statuses, query, sort]);

  function toggleStatus(s: IncidentStatus) {
    setStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  return (
    <div style={{ maxWidth: 1400, margin: "14px auto 40px", padding: "0 16px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
      <div className="panel" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, height: "fit-content" }}>
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.filters.search}
          style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6, fontSize: 14 }}
        />
        <div>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{dict.filters.category}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid var(--gris-vora)", borderRadius: 5 }}>
            <option value="">{locale === "ca" ? "Totes" : "Todas"}</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{dict.filters.neighborhood}</label>
          <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid var(--gris-vora)", borderRadius: 5 }}>
            <option value="">{locale === "ca" ? "Tots" : "Todos"}</option>
            {neighborhoods.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{dict.filters.status}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FILTERABLE_STATUSES.map((s) => (
              <button
                key={s} onClick={() => toggleStatus(s)}
                style={{
                  border: "1px solid var(--gris-vora)", padding: "5px 10px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                  background: statuses.has(s) ? "var(--blau)" : "#fff", color: statuses.has(s) ? "#fff" : "var(--gris-mig)",
                }}
              >
                {dict.status[s]}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setCategory(""); setNeighborhood(""); setStatuses(new Set()); setQuery(""); }}>
          {dict.filters.clear}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <MapView
          incidents={filtered.map((i) => ({ id: i.id, title: i.title, status: i.status, latitude: i.latitude, longitude: i.longitude }))}
          onMarkerClick={(id) => { window.location.href = `/${locale}/incidencies/${id}`; }}
        />
        <div className="panel" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ fontSize: 16 }}>{dict.home.recent}</h3>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid var(--gris-vora)", fontSize: 13 }}>
              <option value="recent">{dict.filters.sortRecent}</option>
              <option value="old">{dict.filters.sortOld}</option>
              <option value="support">{dict.filters.sortSupport}</option>
            </select>
          </div>
          <div style={{ margin: "10px 0", fontSize: 12.5, color: "var(--gris-mig)" }}>
            {filtered.length} {locale === "ca" ? "resultats" : "resultados"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--gris-mig)", padding: "20px 0" }}>{dict.home.noResults}</div>}
            {filtered.slice(0, 40).map((inc) => (
              <IncidentCard key={inc.id} incident={inc} dict={dict} locale={locale} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
