import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import { IncidentExplorer } from "@/components/IncidentExplorer";
import type { IncidentListItem } from "@/components/IncidentCard";

export const revalidate = 30; // segons — refresca la llista pública periòdicament

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();

  const [{ data: incidentRows }, { data: categories }, { data: neighborhoods }] = await Promise.all([
    supabase
      .from("incidents")
      .select(
        "id,public_id,title,status,support_count,created_at,is_demo,latitude,longitude,categories(name),neighborhoods(name),photos(url,is_primary)"
      )
      .neq("status", "moderacio")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("categories").select("id,name").order("name"),
    supabase.from("neighborhoods").select("id,name").order("name"),
  ]);

  const incidents: (IncidentListItem & { latitude: number; longitude: number })[] = (incidentRows ?? []).map((r: any) => ({
    id: r.id,
    public_id: r.public_id,
    title: r.title,
    status: r.status,
    support_count: r.support_count,
    created_at: r.created_at,
    is_demo: r.is_demo,
    latitude: r.latitude,
    longitude: r.longitude,
    category_name: r.categories?.name ?? null,
    neighborhood_name: r.neighborhoods?.name ?? null,
    photo_url:
      r.photos?.find((p: any) => p.is_primary)?.url ??
      r.photos?.[0]?.url ??
      null,
  }));

  return (
    <>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "22px 16px 6px" }}>
        <h2 style={{ fontSize: 26, color: "var(--blau-fosc)", marginBottom: 4 }}>{dict.home.title}</h2>
        <p style={{ color: "var(--gris-mig)", fontSize: 15, maxWidth: 640 }}>{dict.home.lead}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link href={`/${params.locale}/incidencies/nova`} className="btn btn-primary">{dict.home.newIncident}</Link>
        </div>
      </div>
      <IncidentExplorer incidents={incidents} categories={categories ?? []} neighborhoods={neighborhoods ?? []} />
    </>
  );
}
