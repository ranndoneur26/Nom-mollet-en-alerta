import Link from "next/link";
import { StatusPill } from "./StatusPill";
import type { IncidentStatus } from "@/types/database.types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export interface IncidentListItem {
  id: string;
  public_id: string;
  title: string;
  status: IncidentStatus;
  support_count: number;
  created_at: string;
  is_demo: boolean;
  category_name: string | null;
  neighborhood_name: string | null;
  photo_url: string | null;
}

export function IncidentCard({
  incident, dict, locale,
}: { incident: IncidentListItem; dict: Dictionary; locale: string }) {
  const date = new Date(incident.created_at).toLocaleDateString(locale === "ca" ? "ca-ES" : "es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  return (
    <Link href={`/${locale}/incidencies/${incident.id}`} className="i-card">
      <div style={{ width: 64, height: 64, borderRadius: 5, background: "#EDEBE3", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gris-mig)" }}>
        {incident.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={incident.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : "📍"}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div>
            <span className="i-title">{incident.title}</span>
            {incident.is_demo && <span className="demo-flag">{dict.demoBadge}</span>}
          </div>
          <span style={{ fontSize: 11.5, color: "var(--gris-mig)" }}>{incident.public_id}</span>
        </div>
        <div className="i-meta">{incident.category_name ?? "—"} · {incident.neighborhood_name ?? "—"} · {date}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <StatusPill status={incident.status} dict={dict} />
          <span style={{ fontSize: 12, color: "var(--verd)", fontWeight: 700 }}>👍 {incident.support_count} {dict.detail.supports}</span>
        </div>
      </div>
    </Link>
  );
}
