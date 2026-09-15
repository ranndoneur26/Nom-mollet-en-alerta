import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const LOCALES = ["ca", "es"] as const;
const DEFAULT_LOCALE = "ca";

function getLocaleFromRequest(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && LOCALES.includes(cookieLocale as any)) return cookieLocale;

  const header = request.headers.get("accept-language") || "";
  if (header.toLowerCase().startsWith("es")) return "es";
  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignora fitxers estàtics i rutes d'API a l'hora de redirigir per idioma.
  const isApi = pathname.startsWith("/api");
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  let response = NextResponse.next({ request: { headers: request.headers } });

  if (!isApi && !hasLocale) {
    const locale = getLocaleFromRequest(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    response = NextResponse.redirect(url);
  }

  // Refresca la sessió de Supabase (necessari amb @supabase/ssr al middleware)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Excloure fitxers estàtics i imatges. La resta de rutes passen pel
     * middleware per gestionar idioma i sessió.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
