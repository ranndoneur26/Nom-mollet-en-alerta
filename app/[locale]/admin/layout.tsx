import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale } from "@/lib/i18n/get-dictionary";
import type { UserRole } from "@/types/database.types";

const STAFF_ROLES: UserRole[] = ["moderator", "gestor", "regidor", "tecnic", "admin", "superadmin"];

export default async function AdminLayout({
  children, params,
}: { children: React.ReactNode; params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  let role: UserRole | null = null;
  if (auth.user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
    role = (profile?.role as UserRole) ?? null;
  }

  if (!role || !STAFF_ROLES.includes(role)) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center", color: "var(--gris-mig)" }}>
        {dict.admin.forbidden}
      </div>
    );
  }

  const base = `/${params.locale}/admin`;
  const links = [
    [base, dict.admin.dashboard],
    [`${base}/moderacio`, dict.admin.moderation],
    [`${base}/incidencies`, dict.admin.incidents],
    [`${base}/categories`, dict.admin.categories],
    [`${base}/auditoria`, dict.admin.audit],
  ] as const;

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 16px 60px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 18 }}>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {links.map(([href, label]) => (
          <Link key={href} href={href} style={{ padding: "10px 12px", borderRadius: 5, fontSize: 13.5, fontWeight: 600, color: "var(--gris-fosc)", textDecoration: "none" }}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="panel" style={{ padding: 20, minHeight: 400 }}>{children}</div>
    </div>
  );
}
