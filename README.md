# MOLLET EN ALERTA — Next.js + Supabase

Migració real (backend inclòs) de l'MVP de **MOLLET EN ALERTA**, la plataforma
ciutadana independent d'incidències de Mollet del Vallès.

> **MOLLET EN ALERTA és una plataforma ciutadana independent. No és una
> aplicació oficial de l'Ajuntament de Mollet del Vallès.**

Aquest projecte substitueix el prototip autònom en un sol fitxer HTML
(`mollet-en-alerta.html`, lliurat anteriorment) per una aplicació real amb
base de dades, autenticació i Row Level Security a Supabase, desplegable a
Vercel.

---

## 0. Fase 0 — Investigació municipal (resum)

Igual que al prototip HTML: el cartipàs, els barris, les àrees i les
categories que trobaràs precarregades a `supabase/seed.sql` provenen de la
investigació feta el 12/09/2026 sobre fonts oficials (molletvalles.cat,
transparencia.molletvalles.cat). **No existeix** cap API pública
d'incidències ni Participa311 actiu a Mollet — per això la taxonomia de
categories és una proposta pròpia, i les coordenades de barri són centroides
aproximats. Detalls complets a `MOLLET-EN-ALERTA-arquitectura.md` (document
previ) i a la secció "Transparència → Fonts i metodologia" de l'app.

---

## 1. Arquitectura

```
Frontend:        Next.js 14 (App Router, TypeScript)
Mapa:             Leaflet + leaflet.markercluster (OpenStreetMap)
Base de dades:   PostgreSQL (Supabase)
Autenticació:    Supabase Auth (email + contrasenya, verificació de correu)
Emmagatzematge:  Supabase Storage (bucket `incident-photos`, públic en lectura)
Notificacions:   Trigger SQL → taula `notifications` (+ Realtime al navegador)
                 i Edge Function opcional (`send-notification-email`) amb Resend
Hosting:         Vercel
Gràfics:         Recharts
Idiomes:         Segment de ruta `/ca` (per defecte) i `/es`, diccionaris JSON
```

**Disseny clau**: la majoria de mutacions (crear incidència, donar suport,
comentar, canviar estat, fusionar duplicats) es fan **directament des del
client amb `@supabase/supabase-js`**, protegides per polítiques de Row Level
Security i per la funció `merge_incidents()` (amb `security definer`). No
calen Route Handlers pròpies per a la majoria d'accions — és el patró
recomanat per Supabase i redueix la superfície de codi de servidor.

---

## 2. Posada en marxa

### 2.1. Crear el projecte a Supabase
1. Crea un projecte nou a [supabase.com](https://supabase.com).
2. Obre el **SQL Editor** i executa, en aquest ordre:
   1. `supabase/schema.sql`
   2. `supabase/policies.sql`
   3. `supabase/seed.sql` (dades de referència + ~40 incidències de demostració)
3. A **Authentication → Providers**, activa "Email" (amb confirmació de
   correu si vols verificació abans del primer accés).
4. A **Storage**, comprova que el bucket `incident-photos` s'hagi creat
   (el crea `policies.sql`); si no, crea'l manualment com a bucket públic.

### 2.2. Variables d'entorn
```bash
cp .env.example .env.local
```
Omple `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` des de
**Project Settings → API**. `SUPABASE_SERVICE_ROLE_KEY` només cal si fas
servir `lib/supabase/admin.ts` per a tasques de servidor (p. ex. informes
generats per un cron job) — **mai** l'exposis al client.

### 2.3. Instal·lar i executar en local
```bash
npm install
npm run dev
```
Obre http://localhost:3000 — et redirigirà a `/ca`.

### 2.4. Assignar un rol de moderador/administrador
Per defecte, tothom qui es registra té `role = 'citizen'`. Per provar el
panell d'administració (`/ca/admin`), actualitza manualment el teu perfil un
cop registrat:
```sql
update public.profiles set role = 'admin' where alias = '@El_teu_alies';
```

### 2.5. Desplegament a Vercel
1. Puja el repositori a GitHub/GitLab.
2. Importa'l a [vercel.com/new](https://vercel.com/new).
3. Configura les mateixes variables d'entorn de `.env.example` al projecte
   de Vercel (Settings → Environment Variables).
4. Deploy. Vercel detecta Next.js automàticament.

### 2.6. (Opcional) Notificacions per correu
Les notificacions internes ja funcionen sense cap configuració addicional
(taula `notifications` + Realtime al navegador — la campaneta 🔔 de la
barra superior). Per enviar-les també per correu:
1. `supabase functions deploy send-notification-email`
2. `supabase secrets set RESEND_API_KEY=... NOTIFICATIONS_FROM_EMAIL=...`
3. A Supabase Dashboard → Database → Webhooks, crea un webhook sobre
   `INSERT` a la taula `notifications` que cridi aquesta Edge Function.

---

## 3. Estat de la migració respecte l'especificació original

| Funcionalitat | Estat |
|---|---|
| Mapa (Leaflet + clustering) | ✅ |
| Registre / Login (Supabase Auth) | ✅ (verificació de correu inclosa si l'actives al provider) |
| Crear incidència (categoria, ubicació, foto, urgència) | ✅ |
| Moderació prèvia obligatòria | ✅ (RLS: `status <> 'moderacio'` per ser públic) |
| Estats i historial (`status_history`) | ✅ |
| Suports ("Jo també ho he detectat") | ✅ (1 per usuari, via clau primària composta) |
| Comentaris ciutadans vs. actualitzacions oficials | ✅ (`is_official`, restringit per RLS) |
| Assignació automàtica àrea/regidor | ✅ (trigger `incidents_before_insert`) |
| Categories configurables sense tocar codi | ✅ (`/admin/categories`, editable en calent) |
| Fusió de duplicats | ✅ (funció `merge_incidents`, RPC) |
| Notificacions | ✅ internes (Realtime) + ⚙️ correu opcional (Edge Function + Resend) |
| Dashboard i estadístiques | ✅ (Recharts) |
| Transparència pública + casos resolts | ✅ |
| Auditoria | ✅ (`audit_log`, trigger automàtic) |
| Bilingüe CA/ES | ✅ (rutes `/ca`, `/es`) |
| Exportació CSV | ✅ (des de `/admin/incidencies`) |
| Exportació Excel/PDF, informes mensuals/anuals automàtics | ⏳ pendent — es poden generar amb el mateix patró CSV o com a Edge Function programada |
| Detecció automàtica de dades sensibles a fotos | ⏳ pendent — requereix un servei extern de visió per computador (no inclòs) |
| CAPTCHA / Turnstile al formulari | ⏳ variables preparades a `.env.example`, integració pendent |
| Rate limiting anti-spam | ⏳ pendent — recomanat amb Vercel Edge Middleware o Supabase Edge Functions |
| Mapa de calor | ⏳ no migrat (existia al prototip HTML); es pot recuperar amb `react-leaflet-heatmap-layer` |

---

## 4. Estructura del projecte

```
app/
  layout.tsx                    Layout arrel (html/body)
  globals.css
  [locale]/
    layout.tsx                  NavBar, banner, peu, DictionaryProvider
    page.tsx                    Inici: mapa + llista
    login/, registre/
    incidencies/nova/           Formulari de creació (4 passos)
    incidencies/[id]/           Fitxa de detall
    estadistiques/              Dashboard amb Recharts
    transparencia/              Transparència pública + fonts
    admin/                      Panell d'administració (protegit per rol)
      moderacio/, incidencies/, categories/, auditoria/
components/                     Components reutilitzables (mapa, targetes, formularis)
lib/
  supabase/                     Clients (browser, server, admin)
  i18n/                         Diccionaris CA/ES i context de React
  reference-data.ts             Colors d'estat, fonts oficials
types/database.types.ts         Tipus TypeScript de l'esquema
supabase/
  schema.sql                    Taules, tipus, funcions, triggers
  policies.sql                  Row Level Security
  seed.sql                      Dades de referència + demostració
  functions/send-notification-email/  Edge Function (Resend)
middleware.ts                   Enrutament d'idioma + refresc de sessió
```

## 5. Privacitat i seguretat (com s'aplica cada principi)

- **El correu electrònic no es publica mai**: no existeix cap columna
  `email` a `public.profiles`; viu exclusivament a `auth.users`, inaccessible
  amb la clau anònima.
- **Minimització de dades**: `profiles` només conté `alias`, `role` i
  `blocked`.
- **RLS pertot arreu**: cap taula és de lectura/escriptura lliure; vegeu
  `supabase/policies.sql` per a cada regla i la seva justificació.
- **Auditoria automàtica**: qualsevol canvi d'estat o d'àrea assignada queda
  registrat a `audit_log` per un trigger, no depèn que el frontend ho faci bé.
- **Contrasenyes**: gestionades íntegrament per Supabase Auth (mai en text
  pla, mai a taules pròpies).

## 6. Limitacions conegudes d'aquest lliurament

- No s'ha pogut instal·lar `node_modules` ni fer `next build` en aquest
  entorn (sense accés a xarxa), de manera que el codi no s'ha compilat ni
  executat realment. S'ha revisat amb `tsc` (comprovació sintàctica) i
  s'ha seguit el patró oficial de `@supabase/ssr` per a Next.js App Router,
  però és recomanable que, en clonar el projecte, executis `npm run build`
  abans de desplegar per detectar qualsevol ajust necessari de versions.
- El mapa de calor, l'exportació a Excel/PDF i els informes automàtics
  mensuals/anuals del prototip HTML no s'han migrat encara (vegeu taula §3).
