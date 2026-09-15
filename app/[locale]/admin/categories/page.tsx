import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import { CategoryEditor } from "@/components/admin/CategoryEditor";

export const revalidate = 0;

export default async function AdminCategoriesPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();

  const [{ data: categories }, { data: areas }, { data: councillors }] = await Promise.all([
    supabase.from("categories").select("id,name,default_area_id,default_councillor_id,subcategories(name)").order("name"),
    supabase.from("municipal_areas").select("id,name").order("name"),
    supabase.from("councillors").select("id,full_name").order("full_name"),
  ]);

  return (
    <div>
      <h3>{dict.admin.categories}</h3>
      <p style={{ fontSize: 12.5, color: "var(--gris-mig)", marginBottom: 10 }}>
        {params.locale === "ca"
          ? "Edita l'àrea i el/la regidor/a de referència per a cada categoria. Els canvis s'apliquen a les noves assignacions automàtiques."
          : "Edita el área y el/la concejal/a de referencia para cada categoría. Los cambios se aplican a las nuevas asignaciones automáticas."}
      </p>
      <CategoryEditor categories={(categories as any) ?? []} areas={areas ?? []} councillors={councillors ?? []} />
    </div>
  );
}
