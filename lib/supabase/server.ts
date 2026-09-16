import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client de Supabase per usar en Server Components, Server Actions i Route
 * Handlers. Llegeix/escriu la sessió a través de les cookies de la petició.
 * Segueix respectant Row Level Security — no és un client "admin".
 *
 * Nota tècnica: sense el genèric `<Database>` (vegeu el comentari a
 * lib/supabase/client.ts per l'explicació).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Es pot ignorar si crida des d'un Server Component (Next.js
            // refresca la sessió al middleware).
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // idem
          }
        },
      },
    }
  );
}
