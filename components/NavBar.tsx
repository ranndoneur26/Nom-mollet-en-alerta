"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import type { UserRole } from "@/types/database.types";

const STAFF_ROLES: UserRole[] = ["moderator", "gestor", "regidor", "tecnic", "admin", "superadmin"];

export function NavBar() {
  const { dict, locale } = useDictionary();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [alias, setAlias] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ id: number; message: string; read: boolean; created_at: string; incident_id: string | null }[]>([]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setAlias(null); setRole(null); return; }
      const { data: profile } = await supabase
        .from("profiles").select("alias, role").eq("id", auth.user.id).single();
      setAlias(profile ? profile.alias : null);
      setRole(profile ? (profile.role as UserRole) : null);

      const { data: notifRows } = await supabase
        .from("notifications").select("*").eq("user_id", auth.user.id)
        .order("created_at", { ascending: false }).limit(30);
      setNotifs(notifRows ?? []);
      setUnread((notifRows ?? []).filter((n) => !n.read).length);

      channel = supabase
        .channel("notifications-" + auth.user.id)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${auth.user.id}` },
          (payload) => {
            setNotifs((prev) => [payload.new as any, ...prev]);
            setUnread((u) => u + 1);
          }
        )
        .subscribe();
    }
    loadProfile();

    const { data: sub } = supabase.auth.onAuthStateChange(() => loadProfile());
    return () => { sub.subscription.unsubscribe(); if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  async function openNotifPanel() {
    setNotifOpen((v) => !v);
    if (!notifOpen && unread > 0) {
      const ids = notifs.filter((n) => !n.read).map((n) => n.id);
      if (ids.length) {
        await supabase.from("notifications").update({ read: true }).in("id", ids);
        setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
      }
    }
  }

  const restOfPath = pathname.replace(/^\/(ca|es)/, "") || "";
  const isActive = (seg: string) => pathname === `/${locale}${seg}`;

  return (
    <div className="topbar">
      <Link href={`/${locale}`} className="brand">
        <div className="brand-mark">MA</div>
        <div className="brand-text">
          <h1>{dict.brand}</h1>
          <span>{dict.subtitle}</span>
        </div>
      </Link>
      <nav className="topnav">
        <Link href={`/${locale}`} className={isActive("") ? "active" : ""}>{dict.nav.map}</Link>
        <Link href={`/${locale}/estadistiques`} className={isActive("/estadistiques") ? "active" : ""}>{dict.nav.stats}</Link>
        <Link href={`/${locale}/transparencia`} className={isActive("/transparencia") ? "active" : ""}>{dict.nav.transparency}</Link>
        {role && STAFF_ROLES.includes(role) && (
          <Link href={`/${locale}/admin`} className={pathname.startsWith(`/${locale}/admin`) ? "active" : ""}>{dict.nav.admin}</Link>
        )}
      </nav>
      <div style={{ display: "flex", border: "1px solid #3c5866", borderRadius: 6, overflow: "hidden" }}>
        <Link href={`/ca${restOfPath}`} style={{ padding: "7px 10px", fontSize: 12.5, fontWeight: 700, color: locale === "ca" ? "#fff" : "#b9c7cc", background: locale === "ca" ? "var(--verd)" : "transparent", textDecoration: "none" }}>CA</Link>
        <Link href={`/es${restOfPath}`} style={{ padding: "7px 10px", fontSize: 12.5, fontWeight: 700, color: locale === "es" ? "#fff" : "#b9c7cc", background: locale === "es" ? "var(--verd)" : "transparent", textDecoration: "none" }}>ES</Link>
      </div>
      {alias ? (
        <>
          <button onClick={logout} className="acct-btn" style={{ border: 0 }}>{alias}</button>
          <div style={{ position: "relative" }}>
            <button
              onClick={openNotifPanel}
              aria-label="Notificacions"
              style={{ position: "relative", background: "transparent", border: "1px solid #3c5866", color: "#dce6e8", padding: "7px 10px", borderRadius: 6, fontSize: 16 }}
            >
              🔔
              {unread > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "var(--vermell)", color: "#fff", fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{unread}</span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", border: "1px solid var(--gris-vora)", borderRadius: 8, width: 300, maxHeight: 340, overflow: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.18)", zIndex: 90 }}>
                {notifs.length === 0 && <div style={{ padding: 16, fontSize: 13, color: "var(--gris-mig)" }}>—</div>}
                {notifs.map((n) => (
                  <Link
                    key={n.id}
                    href={n.incident_id ? `/${locale}/incidencies/${n.incident_id}` : `/${locale}`}
                    style={{ display: "block", padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 12.5, color: "var(--gris-fosc)", textDecoration: "none", background: n.read ? "transparent" : "#eef6f3" }}
                  >
                    {n.message}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Link href={`/${locale}/login`} className="acct-btn">{dict.nav.login}</Link>
      )}
    </div>
  );
}
