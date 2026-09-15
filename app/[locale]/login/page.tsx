"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/dictionary-context";

export default function LoginPage() {
  const { dict, locale } = useDictionary();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    const next = searchParams.get("next") || `/${locale}`;
    router.push(next);
    router.refresh();
  }

  return (
    <div className="panel" style={{ maxWidth: 420, margin: "40px auto", padding: 24 }}>
      <h3>{dict.auth.loginTitle}</h3>
      {error && <div className="warn-box" style={{ background: "#fbeae7", color: "var(--vermell)" }}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.auth.email}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.auth.password}</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading} type="submit">
          {loading ? "…" : dict.auth.loginTitle}
        </button>
      </form>
      <Link href={`/${locale}/registre`} className="btn btn-ghost" style={{ width: "100%", textAlign: "center", marginTop: 8, display: "block" }}>
        {dict.auth.toRegister}
      </Link>
    </div>
  );
}
