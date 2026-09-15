import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import { StatsCharts } from "@/components/StatsCharts";

export const revalidate = 60;

export default async function StatsPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();

  const { data: incidents } = await supabase
    .from("incidents")
    .select("status, created_at, resolution_date, categories(name), neighborhoods(name), urgency")
    .neq("status", "moderacio");

  const rows = (incidents as any[]) ?? [];
  const total = rows.length;
  const countBy = (pred: (r: any) => boolean) => rows.filter(pred).length;
  const pending = countBy((r) => r.status === "pendent");
  const inStudy = countBy((r) => r.status === "estudi");
  const inProgress = countBy((r) => r.status === "tramitacio");
  const resolved = countBy((r) => r.status === "resolta" || r.status === "tancada");
  const urgent = countBy((r) => r.urgency === "urgent" || r.urgency === "risc");
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  const withResolution = rows.filter((r) => r.resolution_date);
  const avgDays = withResolution.length
    ? Math.round(
        withResolution.reduce((sum, r) => sum + (+new Date(r.resolution_date) - +new Date(r.created_at)) / 86400000, 0) /
          withResolution.length
      )
    : 0;

  const byMonthMap: Record<string, number> = {};
  rows.forEach((r) => {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonthMap[key] = (byMonthMap[key] || 0) + 1;
  });
  const byMonth = Object.entries(byMonthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
    .map(([month, count]) => ({ month, count }));

  const byCategoryMap: Record<string, number> = {};
  rows.forEach((r) => { const n = r.categories?.name ?? "—"; byCategoryMap[n] = (byCategoryMap[n] || 0) + 1; });
  const byCategory = Object.entries(byCategoryMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  const byStatusMap: Record<string, number> = {};
  rows.forEach((r) => { byStatusMap[r.status] = (byStatusMap[r.status] || 0) + 1; });
  const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

  const byHoodMap: Record<string, number> = {};
  rows.forEach((r) => { const n = r.neighborhoods?.name ?? "—"; byHoodMap[n] = (byHoodMap[n] || 0) + 1; });
  const byNeighborhood = Object.entries(byHoodMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  const kpis: [number | string, string][] = [
    [total, dict.dashboard.total], [pending, dict.dashboard.pending], [inStudy, dict.dashboard.inStudy],
    [inProgress, dict.dashboard.inProgress], [resolved, dict.dashboard.resolved], [urgent, dict.dashboard.urgent],
    [`${pct}%`, dict.dashboard.pctResolved], [`${avgDays}d`, dict.dashboard.avgTime],
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 50px" }}>
      <h2 style={{ fontSize: 24, color: "var(--blau-fosc)" }}>{dict.dashboard.title}</h2>
      <p style={{ color: "var(--gris-mig)", fontSize: 14, marginBottom: 6 }}>{dict.dashboard.lead}</p>
      <div className="kpi-grid">
        {kpis.map(([n, l]) => (
          <div className="kpi" key={l}><div className="num">{n}</div><div className="lbl">{l}</div></div>
        ))}
      </div>
      <StatsCharts byMonth={byMonth} byCategory={byCategory} byStatus={byStatus} byNeighborhood={byNeighborhood} />
    </div>
  );
}
