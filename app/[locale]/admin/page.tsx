import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";

export default async function AdminDashboard({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();

  const { data } = await supabase.from("incidents").select("status");
  const rows = data ?? [];
  const total = rows.length;
  const moderation = rows.filter((r) => r.status === "moderacio").length;
  const resolved = rows.filter((r) => r.status === "resolta" || r.status === "tancada").length;
  const pct = total ? Math.round((resolved / total) * 100) : 0;

  return (
    <div>
      <h3>{dict.admin.dashboard}</h3>
      <div className="kpi-grid" style={{ marginTop: 12 }}>
        <div className="kpi"><div className="num">{total}</div><div className="lbl">{dict.dashboard.total}</div></div>
        <div className="kpi"><div className="num">{moderation}</div><div className="lbl">{dict.status.moderacio}</div></div>
        <div className="kpi"><div className="num">{resolved}</div><div className="lbl">{dict.dashboard.resolved}</div></div>
        <div className="kpi"><div className="num">{pct}%</div><div className="lbl">{dict.dashboard.pctResolved}</div></div>
      </div>
    </div>
  );
}
