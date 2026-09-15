import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export const revalidate = 0;

export default async function ModerationPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();
  const { data } = await supabase
    .from("incidents")
    .select("id,public_id,title,demo_author_alias,categories(name)")
    .eq("status", "moderacio")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h3>{dict.admin.moderation}</h3>
      <div style={{ marginTop: 14 }}>
        <ModerationQueue items={(data as any) ?? []} />
      </div>
    </div>
  );
}
