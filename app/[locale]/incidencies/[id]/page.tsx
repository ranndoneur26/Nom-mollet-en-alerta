import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import { StatusPill } from "@/components/StatusPill";
import { IncidentDetailActions } from "@/components/IncidentDetailActions";

export const revalidate = 0;

export default async function IncidentDetailPage({
  params,
}: { params: { locale: Locale; id: string } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();

  const { data: incident } = await supabase
    .from("incidents")
    .select(
      `id, public_id, title, description, status, urgency, support_count, address, created_at, resolution_date, duplicate_of, out_of_scope_body,
       categories(name), subcategories(name), neighborhoods(name),
       municipal_areas(name), councillors(full_name),
       photos(url,is_primary), comments(id,body,is_official,created_at,author_id,profiles(alias)),
       status_history(old_status,new_status,note,changed_at)`
    )
    .eq("id", params.id)
    .single();

  if (!incident) notFound();

  const cat = incident as any;
  const photos: { url: string; is_primary: boolean }[] = cat.photos ?? [];
  const history = (cat.status_history ?? []).sort(
    (a: any, b: any) => +new Date(a.changed_at) - +new Date(b.changed_at)
  );

  let duplicateTarget: { id: string; public_id: string } | null = null;
  if (cat.duplicate_of) {
    const { data: target } = await supabase.from("incidents").select("id,public_id").eq("id", cat.duplicate_of).single();
    duplicateTarget = target;
  }

  return (
    <div className="panel" style={{ maxWidth: 760, margin: "20px auto 60px", padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <div>
          <h3 style={{ fontSize: 20 }}>{cat.title}</h3>
          <div style={{ color: "var(--gris-mig)", fontSize: 13 }}>{cat.public_id} · 📍 {cat.address} ({cat.neighborhoods?.name ?? "—"})</div>
        </div>
        <StatusPill status={cat.status} dict={dict} />
      </div>

      {cat.status === "fora" && (
        <div className="warn-box">⚫ {dict.detail.outOfScope}{cat.out_of_scope_body ? `: ${cat.out_of_scope_body}` : ""}. {dict.detail.outOfScopeNote}</div>
      )}
      {cat.status === "duplicada" && duplicateTarget && (
        <div className="warn-box">
          🔗 {dict.detail.mergedInto}{" "}
          <a href={`/${params.locale}/incidencies/${duplicateTarget.id}`}>{duplicateTarget.public_id}</a>
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 8, margin: "10px 0", flexWrap: "wrap" }}>
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p.url} alt="" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 5, border: "1px solid var(--gris-vora)" }} />
          ))}
        </div>
      )}

      <p>{cat.description}</p>

      <div style={{ fontSize: 13, color: "var(--gris-mig)", display: "flex", gap: 14, flexWrap: "wrap" }}>
        <span>{cat.categories?.name} / {cat.subcategories?.name ?? ""}</span>
        <span>{dict.detail.responsible}: {cat.municipal_areas?.name ?? "—"} — {cat.councillors?.full_name ?? "—"}</span>
        <span>{new Date(cat.created_at).toLocaleDateString(params.locale === "ca" ? "ca-ES" : "es-ES")}</span>
      </div>

      <h4 style={{ fontSize: 14, margin: "16px 0 4px" }}>{dict.detail.history}</h4>
      <ul style={{ listStyle: "none", padding: 0, margin: "10px 0", borderLeft: "2px solid var(--gris-vora)" }}>
        {history.map((h: any, i: number) => (
          <li key={i} style={{ padding: "0 0 12px 16px", fontSize: 13.5, position: "relative" }}>
            <span style={{ fontWeight: 700 }}>{new Date(h.changed_at).toLocaleDateString(params.locale === "ca" ? "ca-ES" : "es-ES")}</span>
            {" — "}{h.note ?? dict.status[h.new_status as keyof typeof dict.status]}
          </li>
        ))}
      </ul>

      <IncidentDetailActions
        incidentId={cat.id}
        initialSupportCount={cat.support_count}
        initialComments={cat.comments ?? []}
      />
    </div>
  );
}
