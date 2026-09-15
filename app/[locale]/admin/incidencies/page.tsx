import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import { IncidentAdminTable } from "@/components/admin/IncidentAdminTable";

export const revalidate = 0;

export default async function AdminIncidentsPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();
  const { data } = await supabase
    .from("incidents")
    .select("id,public_id,title,status,neighborhoods(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h3>{dict.admin.incidents}</h3>
      <div style={{ marginTop: 14 }}>
        <IncidentAdminTable rows={(data as any) ?? []} />
      </div>
    </div>
  );
}
