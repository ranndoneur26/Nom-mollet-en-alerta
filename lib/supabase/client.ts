import { createBrowserClient } from "@supabase/ssr";

/**
 * Client de Supabase per usar en Client Components ("use client").
 * Utilitza la clau anònima (anon key) — protegit per Row Level Security,
 * mai la service role key.
 *
 * Nota tècnica: no s'utilitza el genèric `<Database>` de types/database.types.ts
 * aquí. Aquell fitxer és manual (no generat amb `supabase gen types`), i la
 * seva forma no encaixa exactament amb el que `@supabase/supabase-js` espera
 * internament (Views/Functions/Enums/Relationships), cosa que fa que
 * TypeScript dedueixi `never` en alguns `.insert()`/`.select()`. Fins que no
 * es generin els tipus reals amb `supabase gen types typescript`, el client
 * es manté sense tipar estrictament i cada component fa el cast puntual que
 * necessiti (com ja es feia a CreateIncidentForm.tsx).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
