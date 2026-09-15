"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/dictionary-context";

export default function RegisterPage() {
  const { dict, locale } = useDictionary();
  const supabase = createClient();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) { setError(dict.auth.acceptTerms); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { alias }, // llegit pel trigger handle_new_user() per crear el perfil
        emailRedirectTo: `${window.location.origin}/${locale}`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="panel" style={{ maxWidth: 420, margin: "40px auto", padding: 24, textAlign: "center" }}>
        <h3>{dict.auth.registerTitle}</h3>
        <p>{dict.auth.checkEmail}</p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ maxWidth: 420, margin: "40px auto", padding: 24 }}>
      <h3>{dict.auth.registerTitle}</h3>
      {error && <div className="warn-box" style={{ background: "#fbeae7", color: "var(--vermell)" }}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.auth.alias}</label>
          <input type="text" required placeholder="@MolletVei" value={alias} onChange={(e) => setAlias(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }} />
          <div style={{ fontSize: 12, color: "var(--gris-mig)", marginTop: 4 }}>{dict.auth.aliasHint}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.auth.email}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.auth.password}</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }} />
        </div>
        <label style={{ display: "flex", gap: 8, fontWeight: 400, fontSize: 13, alignItems: "flex-start", marginBottom: 14 }}>
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ marginTop: 3 }} />
          {dict.auth.acceptTerms}
        </label>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading} type="submit">
          {loading ? "…" : dict.auth.registerTitle}
        </button>
      </form>
      <Link href={`/${locale}/login`} className="btn btn-ghost" style={{ width: "100%", textAlign: "center", marginTop: 8, display: "block" }}>
        {dict.auth.toLogin}
      </Link>
    </div>
  );
}
