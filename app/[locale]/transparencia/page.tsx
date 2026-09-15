import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import { SOURCES } from "@/lib/reference-data";

export const revalidate = 60;

export default async function TransparencyPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();

  const { data: incidents } = await supabase
    .from("incidents")
    .select("status, created_at, resolution_date, neighborhoods(id,name)")
    .neq("status", "moderacio");

  const rows = (incidents as any[]) ?? [];
  const total = rows.length;
  const resolved = rows.filter((r) => r.status === "resolta" || r.status === "tancada").length;
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  const withRes = rows.filter((r) => r.resolution_date);
  const avgDays = withRes.length
    ? Math.round(withRes.reduce((s, r) => s + (+new Date(r.resolution_date) - +new Date(r.created_at)) / 86400000, 0) / withRes.length)
    : 0;

  const { data: neighborhoods } = await supabase.from("neighborhoods").select("id,name").order("name");
  const hoodStats = (neighborhoods ?? []).map((h) => {
    const hl = rows.filter((r) => r.neighborhoods?.id === h.id);
    const res = hl.filter((r) => r.status === "resolta" || r.status === "tancada").length;
    const withR = hl.filter((r) => r.resolution_date);
    const avg = withR.length
      ? Math.round(withR.reduce((s, r) => s + (+new Date(r.resolution_date) - +new Date(r.created_at)) / 86400000, 0) / withR.length)
      : null;
    return { name: h.name, total: hl.length, resolved: res, pending: hl.length - res, avg };
  });

  const { data: resolvedWithPhoto } = await supabase
    .from("incidents")
    .select("id,title,resolution_date,updated_at,neighborhoods(name),photos(url,is_primary)")
    .in("status", ["resolta", "tancada"])
    .order("resolution_date", { ascending: false })
    .limit(8);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px 50px" }}>
      <h2 style={{ fontSize: 24, color: "var(--blau-fosc)" }}>{dict.transparency.title}</h2>
      <p style={{ color: "var(--gris-mig)", fontSize: 14, marginBottom: 16 }}>{dict.transparency.lead}</p>

      <div className="kpi-grid">
        <div className="kpi"><div className="num">{total}</div><div className="lbl">{dict.dashboard.total}</div></div>
        <div className="kpi"><div className="num">{resolved}</div><div className="lbl">{dict.dashboard.resolved}</div></div>
        <div className="kpi"><div className="num">{pct}%</div><div className="lbl">{dict.dashboard.pctResolved}</div></div>
        <div className="kpi"><div className="num">{avgDays}d</div><div className="lbl">{dict.dashboard.avgTime}</div></div>
      </div>

      <h3 style={{ margin: "26px 0 10px", fontSize: 16 }}>{dict.dashboard.byNeighborhood}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, background: "#fff", border: "1px solid var(--gris-vora)" }}>
        <thead>
          <tr style={{ background: "#F0EEE7" }}>
            <th style={{ padding: "9px 12px", textAlign: "left" }}>{dict.filters.neighborhood}</th>
            <th style={{ padding: "9px 12px", textAlign: "left" }}>Total</th>
            <th style={{ padding: "9px 12px", textAlign: "left" }}>{dict.dashboard.resolved}</th>
            <th style={{ padding: "9px 12px", textAlign: "left" }}>{dict.dashboard.pending}</th>
            <th style={{ padding: "9px 12px", textAlign: "left" }}>{dict.dashboard.avgTime}</th>
          </tr>
        </thead>
        <tbody>
          {hoodStats.map((h) => (
            <tr key={h.name} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "9px 12px" }}>{h.name}</td>
              <td style={{ padding: "9px 12px" }}>{h.total}</td>
              <td style={{ padding: "9px 12px" }}>{h.resolved}</td>
              <td style={{ padding: "9px 12px" }}>{h.pending}</td>
              <td style={{ padding: "9px 12px" }}>{h.avg ? `${h.avg}d` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ margin: "26px 0 10px", fontSize: 16 }}>{dict.transparency.resolvedCases}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 10 }}>
        {(resolvedWithPhoto ?? [])
          .filter((r: any) => r.photos?.length)
          .map((r: any) => (
            <a key={r.id} href={`/${params.locale}/incidencies/${r.id}`} className="i-card" style={{ flexDirection: "column" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photos.find((p: any) => p.is_primary)?.url ?? r.photos[0].url} alt="" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 5 }} />
              <div style={{ marginTop: 8 }}>
                <div className="i-title" style={{ fontSize: 13 }}>{r.title}</div>
                <div className="i-meta">{r.neighborhoods?.name}</div>
              </div>
            </a>
          ))}
      </div>

      <h3 style={{ margin: "26px 0 10px", fontSize: 16 }}>{dict.transparency.sources}</h3>
      <p style={{ fontSize: 13.5, color: "var(--gris-mig)", marginBottom: 10 }}>{dict.transparency.sourcesLead}</p>
      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {SOURCES.map((s) => (
          <li key={s.url} style={{ background: "#fff", border: "1px solid var(--gris-vora)", borderRadius: 5, padding: "10px 12px", fontSize: 13.5 }}>
            📄 <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
