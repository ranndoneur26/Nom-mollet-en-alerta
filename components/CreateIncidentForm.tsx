"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPicker } from "./MapPickerLoader";
import { useDictionary } from "@/lib/i18n/dictionary-context";
import type { UrgencyLevel } from "@/types/database.types";

const URGENCIES: UrgencyLevel[] = ["normal", "important", "urgent", "risc"];

interface CategoryWithSub { id: number; name: string; subcategories: { id: number; name: string }[] }

export function CreateIncidentForm({ categories }: { categories: CategoryWithSub[] }) {
  const { dict, locale } = useDictionary();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState<number | "">(categories[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState<number | "">(categories[0]?.subcategories[0]?.id ?? "");
  const [lat, setLat] = useState(41.5395);
  const [lng, setLng] = useState(2.2131);
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("normal");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  const currentCategory = categories.find((c) => c.id === categoryId);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(dict.form.needLogin);

      const { data: incident, error: insertError } = await supabase
        .from("incidents")
        .insert({
          title,
          description,
          category_id: categoryId || null,
          subcategory_id: subcategoryId || null,
          latitude: lat,
          longitude: lng,
          address,
          urgency,
          author_id: auth.user.id,
        } as any)
        .select("id, public_id")
        .single();
      if (insertError) throw insertError;
      if (!incident) throw new Error("No s'ha pogut crear la incidència");

      if (photoFile) {
        const path = `${incident.id}/${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("incident-photos")
          .upload(path, photoFile, { upsert: false });
        if (!uploadError) {
          const { data: pub } = supabase.storage.from("incident-photos").getPublicUrl(path);
          await supabase.from("photos").insert({ incident_id: incident.id, url: pub.publicUrl, is_primary: true });
        }
      }

      setPublicId(incident.public_id);
      setStep(5);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 5) {
    return (
      <div style={{ textAlign: "center", padding: "30px 0" }}>
        <h3>{dict.form.confirmTitle}</h3>
        <div style={{ fontFamily: "var(--font-cap)", fontSize: 24, fontWeight: 800, color: "var(--verd)", margin: "10px 0" }}>{publicId}</div>
        <p>{dict.form.confirmFollow}</p>
        <p style={{ fontSize: 12.5, color: "var(--gris-mig)" }}>{dict.form.regNotice}</p>
        <button className="btn btn-primary" onClick={() => router.push(`/${locale}`)}>OK</button>
      </div>
    );
  }

  return (
    <div className="panel" style={{ maxWidth: 640, margin: "20px auto", padding: 22 }}>
      {error && <div className="warn-box" style={{ background: "#fbeae7", color: "var(--vermell)" }}>{error}</div>}

      {step === 1 && (
        <>
          <h3>{dict.form.step1}</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.form.category}</label>
            <select
              value={categoryId}
              onChange={(e) => { const id = Number(e.target.value); setCategoryId(id); const c = categories.find((x) => x.id === id); setSubcategoryId(c?.subcategories[0]?.id ?? ""); }}
              style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }}
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.form.subcategory}</label>
            <select value={subcategoryId} onChange={(e) => setSubcategoryId(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }}>
              {currentCategory?.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>{dict.form.next} →</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3>{dict.form.step2}</h3>
          <p style={{ fontSize: 12.5, color: "var(--gris-mig)" }}>{dict.form.clickMap}</p>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={dict.form.address}
            style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6, marginBottom: 6 }} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation}>{dict.form.useLocation}</button>
          <MapPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← {dict.form.back}</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>{dict.form.next} →</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h3>{dict.form.step3}</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.form.title}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.form.description}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", minHeight: 90, padding: 10, border: "1px solid var(--gris-vora)", borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.form.photo}</label>
            <input type="file" accept="image/*" onChange={handlePhoto} />
            <div style={{ fontSize: 12, color: "var(--gris-mig)" }}>{dict.form.photoHint}</div>
            {photoPreview && <img src={photoPreview} alt="" style={{ maxHeight: 120, marginTop: 8, borderRadius: 5 }} />}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>{dict.filters.urgency}</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }} role="radiogroup">
              {URGENCIES.map((u) => (
                <button
                  key={u} type="button" role="radio" aria-checked={urgency === u} onClick={() => setUrgency(u)}
                  style={{ border: urgency === u ? "1.5px solid var(--blau)" : "1.5px solid var(--gris-vora)", background: urgency === u ? "var(--verd-clar)" : "#fff", borderRadius: 6, padding: 9, fontSize: 13, fontWeight: 600 }}
                >
                  {dict.urgency[u]}
                </button>
              ))}
            </div>
            <div className="warn-box">{dict.urgency.warning}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← {dict.form.back}</button>
            <button className="btn btn-primary" onClick={() => title.trim() && setStep(4)}>{dict.form.next} →</button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h3>{dict.form.step4}</h3>
          <p><strong>{title}</strong></p>
          <p style={{ fontSize: 13, color: "var(--gris-mig)" }}>{currentCategory?.name} / {currentCategory?.subcategories.find((s) => s.id === subcategoryId)?.name} · {address}</p>
          <p>{description}</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => setStep(3)}>← {dict.form.back}</button>
            <button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? "…" : dict.form.send}</button>
          </div>
        </>
      )}
    </div>
  );
}
