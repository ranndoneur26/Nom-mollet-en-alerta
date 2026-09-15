import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateIncidentForm } from "@/components/CreateIncidentForm";
import type { Locale } from "@/lib/i18n/get-dictionary";

export default async function NewIncidentPage({ params }: { params: { locale: Locale } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/${params.locale}/login?next=/${params.locale}/incidencies/nova`);

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,subcategories(id,name)")
    .order("name");

  return <CreateIncidentForm categories={(categories as any) ?? []} />;
}
