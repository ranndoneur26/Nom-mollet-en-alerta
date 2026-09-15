"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface Comment { id: string; body: string; is_official: boolean; created_at: string; author_id: string | null; profiles?: { alias: string } | null }

export function IncidentDetailActions({
  incidentId, initialSupportCount, initialComments,
}: { incidentId: string; initialSupportCount: number; initialComments: Comment[] }) {
  const { dict, locale } = useDictionary();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [myAlias, setMyAlias] = useState<string | null>(null);
  const [alreadySupported, setAlreadySupported] = useState(false);
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [comments, setComments] = useState(initialComments);
  const [tab, setTab] = useState<"citizen" | "official">("citizen");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: profile } = await supabase.from("profiles").select("alias").eq("id", data.user.id).single();
      setMyAlias(profile?.alias ?? null);
      const { data: existing } = await supabase
        .from("supports").select("*").eq("incident_id", incidentId).eq("user_id", data.user.id).maybeSingle();
      setAlreadySupported(!!existing);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleSupport() {
    if (!userId) { window.location.href = `/${locale}/login`; return; }
    if (alreadySupported) return;
    const { error } = await supabase.from("supports").insert({ incident_id: incidentId, user_id: userId });
    if (!error) { setAlreadySupported(true); setSupportCount((c) => c + 1); }
  }

  async function sendComment() {
    if (!userId) { window.location.href = `/${locale}/login`; return; }
    const body = commentText.trim();
    if (!body) return;
    const { data, error } = await supabase
      .from("comments").insert({ incident_id: incidentId, author_id: userId, body }).select().single();
    if (!error && data) { setComments((prev) => [...prev, { ...(data as any), profiles: { alias: myAlias ?? "" } }]); setCommentText(""); }
  }

  const citizenComments = comments.filter((c) => !c.is_official);
  const officialComments = comments.filter((c) => c.is_official);

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
        <button
          className={alreadySupported ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
          disabled={alreadySupported}
          onClick={toggleSupport}
        >
          👍 {alreadySupported ? dict.detail.supported : dict.detail.support}
        </button>
        <span style={{ alignSelf: "center", fontSize: 12, color: "var(--verd)", fontWeight: 700 }}>
          {supportCount} {dict.detail.reported}
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--gris-vora)", margin: "14px 0 12px" }}>
        <button
          onClick={() => setTab("citizen")}
          style={{ background: "none", border: 0, padding: "8px 10px", fontSize: 13, fontWeight: 700, color: tab === "citizen" ? "var(--blau)" : "var(--gris-mig)", borderBottom: tab === "citizen" ? "2px solid var(--blau)" : "2px solid transparent" }}
        >{dict.detail.citizenComments}</button>
        <button
          onClick={() => setTab("official")}
          style={{ background: "none", border: 0, padding: "8px 10px", fontSize: 13, fontWeight: 700, color: tab === "official" ? "var(--blau)" : "var(--gris-mig)", borderBottom: tab === "official" ? "2px solid var(--blau)" : "2px solid transparent" }}
        >{dict.detail.officialUpdates}</button>
      </div>

      {tab === "official" ? (
        officialComments.length ? officialComments.map((c) => (
          <div key={c.id} style={{ background: "#EEF6F3", borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 13.5 }}>
            <div style={{ fontSize: 11.5, color: "var(--gris-mig)", marginBottom: 3 }}>{dict.detail.official} · {new Date(c.created_at).toLocaleDateString()}</div>
            {c.body}
          </div>
        )) : <p style={{ color: "var(--gris-mig)", fontSize: 13 }}>—</p>
      ) : (
        <>
          {citizenComments.length ? citizenComments.map((c) => (
            <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "10px 0", fontSize: 13.5 }}>
              <div style={{ fontSize: 11.5, color: "var(--gris-mig)", marginBottom: 3 }}>{c.profiles?.alias ?? "—"} · {new Date(c.created_at).toLocaleDateString()}</div>
              {c.body}
            </div>
          )) : <p style={{ color: "var(--gris-mig)", fontSize: 13 }}>—</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder={dict.detail.commentPlaceholder}
              style={{ flex: 1, padding: 9, border: "1px solid var(--gris-vora)", borderRadius: 6 }}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
            />
            <button className="btn btn-sm btn-primary" onClick={sendComment}>{locale === "ca" ? "Enviar" : "Enviar"}</button>
          </div>
        </>
      )}
    </>
  );
}
