import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * ⚠️ NOMÉS PER A ÚS DE SERVIDOR (Route Handlers / Edge Functions de confiança).
 * Aquest client usa la SERVICE ROLE KEY i per tant IGNORA Row Level Security.
 * No l'importis mai des d'un fitxer marcat amb "use client", ni el retornis
 * al navegador. S'utilitza únicament per a operacions administratives
 * puntuals (p. ex. generar informes agregats, tasques programades) que no
 * poden dependre de la sessió de l'usuari.
 *
 * Nota tècnica: sense el genèric `<Database>` (vegeu el comentari a
 * lib/supabase/client.ts per l'explicació).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
