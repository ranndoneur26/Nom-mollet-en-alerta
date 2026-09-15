import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";

export const revalidate = 0;

export default async function AuditPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id,action,entity,entity_id,old_value,new_value,created_at,profiles(alias)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h3>{dict.admin.audit}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Data</th>
            <th style={{ textAlign: "left", padding: 8 }}>Usuari</th>
            <th style={{ textAlign: "left", padding: 8 }}>Acció</th>
            <th style={{ textAlign: "left", padding: 8 }}>Detall</th>
          </tr>
        </thead>
        <tbody>
          {(data as any[] ?? []).map((a) => (
            <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{new Date(a.created_at).toLocaleString(params.locale === "ca" ? "ca-ES" : "es-ES")}</td>
              <td style={{ padding: 8 }}>{a.profiles?.alias ?? "sistema"}</td>
              <td style={{ padding: 8 }}>{a.action} ({a.entity} {a.entity_id})</td>
              <td style={{ padding: 8, fontFamily: "monospace", fontSize: 11 }}>
                {JSON.stringify(a.old_value)} → {JSON.stringify(a.new_value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
