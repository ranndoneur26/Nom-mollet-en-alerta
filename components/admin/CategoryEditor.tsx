"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Category { id: number; name: string; default_area_id: number | null; default_councillor_id: number | null; subcategories: { name: string }[] }
interface Area { id: number; name: string }
interface Councillor { id: number; full_name: string }

export function CategoryEditor({
  categories, areas, councillors,
}: { categories: Category[]; areas: Area[]; councillors: Councillor[] }) {
  const supabase = createClient();
  const [saved, setSaved] = useState<number | null>(null);

  async function updateArea(catId: number, areaId: number) {
    await supabase.from("categories").update({ default_area_id: areaId }).eq("id", catId);
    setSaved(catId); setTimeout(() => setSaved(null), 1500);
  }
  async function updateCouncillor(catId: number, councillorId: number) {
    await supabase.from("categories").update({ default_councillor_id: councillorId }).eq("id", catId);
    setSaved(catId); setTimeout(() => setSaved(null), 1500);
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 8 }}>Categoria</th>
          <th style={{ textAlign: "left", padding: 8 }}>Subcategories</th>
          <th style={{ textAlign: "left", padding: 8 }}>Àrea municipal</th>
          <th style={{ textAlign: "left", padding: 8 }}>Regidor/a</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((c) => (
          <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: 8, fontWeight: 700 }}>{c.name}</td>
            <td style={{ padding: 8, fontSize: 11.5, maxWidth: 240 }}>{c.subcategories.map((s) => s.name).join(", ")}</td>
            <td style={{ padding: 8 }}>
              <select defaultValue={c.default_area_id ?? ""} onChange={(e) => updateArea(c.id, Number(e.target.value))}>
                <option value="" disabled>—</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </td>
            <td style={{ padding: 8 }}>
              <select defaultValue={c.default_councillor_id ?? ""} onChange={(e) => updateCouncillor(c.id, Number(e.target.value))}>
                <option value="" disabled>—</option>
                {councillors.map((cc) => <option key={cc.id} value={cc.id}>{cc.full_name}</option>)}
              </select>
              {saved === c.id && <span style={{ color: "var(--verd)", fontSize: 11, marginLeft: 6 }}>✓ Desat</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
