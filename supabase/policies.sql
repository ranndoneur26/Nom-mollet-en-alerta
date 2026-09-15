-- =============================================================================
-- MOLLET EN ALERTA — Row Level Security
-- Executa DESPRÉS de schema.sql.
-- Principi: minimització de dades i privacitat des del disseny (secció 7 de
-- l'especificació). El correu electrònic no existeix en cap taula pública.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.photos enable row level security;
alter table public.comments enable row level security;
alter table public.supports enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.municipal_areas enable row level security;
alter table public.councillors enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.reports enable row level security;

-- ---------------------------------------------------------------------------
-- Taules de referència: lectura pública, escriptura només per a personal
-- de gestió (moderador/a o superior).
-- ---------------------------------------------------------------------------
create policy "Lectura pública de barris" on public.neighborhoods for select using (true);
create policy "Escriptura de barris per gestió" on public.neighborhoods for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "Lectura pública d'àrees" on public.municipal_areas for select using (true);
create policy "Escriptura d'àrees per gestió" on public.municipal_areas for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "Lectura pública de regidors" on public.councillors for select using (true);
create policy "Escriptura de regidors per gestió" on public.councillors for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "Lectura pública de categories" on public.categories for select using (true);
create policy "Escriptura de categories per gestió" on public.categories for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "Lectura pública de subcategories" on public.subcategories for select using (true);
create policy "Escriptura de subcategories per gestió" on public.subcategories for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- PROFILES: qualsevol pot veure l'àlies i el rol (informació pública),
-- però només la mateixa persona pot actualitzar el seu perfil. El correu
-- electrònic NO viu en aquesta taula (està a auth.users, inaccessible des
-- del client amb la clau anònima).
-- ---------------------------------------------------------------------------
create policy "Els perfils són visibles per tothom" on public.profiles
  for select using (true);

create policy "Un usuari només edita el seu propi perfil" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- INCIDENTS
-- Visibles si: no estan pendents de moderació, O l'usuari n'és l'autor,
-- O l'usuari és personal de gestió.
-- ---------------------------------------------------------------------------
create policy "Incidències visibles públicament (excepte en moderació)" on public.incidents
  for select using (
    status <> 'moderacio'
    or author_id = auth.uid()
    or public.is_staff(auth.uid())
  );

create policy "Usuaris autenticats poden crear incidències" on public.incidents
  for insert to authenticated
  with check (author_id = auth.uid());

create policy "Només gestió pot editar incidències" on public.incidents
  for update using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- PHOTOS: mateixa visibilitat que la incidència associada.
-- ---------------------------------------------------------------------------
create policy "Fotos visibles si la incidència ho és" on public.photos
  for select using (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id
        and (i.status <> 'moderacio' or i.author_id = auth.uid() or public.is_staff(auth.uid()))
    )
  );

create policy "L'autor de la incidència pot afegir fotos" on public.photos
  for insert to authenticated
  with check (
    exists (select 1 from public.incidents i where i.id = incident_id and i.author_id = auth.uid())
    or public.is_staff(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- COMMENTS: mateixa visibilitat que la incidència. Els comentaris "oficials"
-- (is_official = true) només els pot crear personal de gestió.
-- ---------------------------------------------------------------------------
create policy "Comentaris visibles si la incidència ho és" on public.comments
  for select using (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id
        and (i.status <> 'moderacio' or i.author_id = auth.uid() or public.is_staff(auth.uid()))
    )
  );

create policy "Usuaris autenticats poden comentar" on public.comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (is_official = false or public.is_staff(auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- SUPPORTS: un usuari només pot crear/eliminar el seu propi suport.
-- ---------------------------------------------------------------------------
create policy "Suports visibles per tothom" on public.supports for select using (true);

create policy "Un usuari només gestiona el seu propi suport" on public.supports
  for insert to authenticated with check (user_id = auth.uid());

create policy "Un usuari pot retirar el seu propi suport" on public.supports
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- STATUS_HISTORY: lectura pública (transparència), escriptura només via
-- funcions/triggers amb security definer.
-- ---------------------------------------------------------------------------
create policy "Historial visible per tothom" on public.status_history for select using (true);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS: només visibles i editables (marcar com a llegit) pel propi
-- destinatari.
-- ---------------------------------------------------------------------------
create policy "Un usuari només veu les seves notificacions" on public.notifications
  for select using (user_id = auth.uid());

create policy "Un usuari només marca com a llegides les seves notificacions" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- AUDIT_LOG i REPORTS: només personal de gestió.
-- ---------------------------------------------------------------------------
create policy "Auditoria només visible per a gestió" on public.audit_log
  for select using (public.is_staff(auth.uid()));

create policy "Informes visibles per a gestió" on public.reports
  for select using (public.is_staff(auth.uid()));
create policy "Informes creats per gestió" on public.reports
  for insert to authenticated with check (public.is_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- STORAGE: bucket de fotografies d'incidències (crear-lo abans amb aquest SQL
-- o des del panell de Supabase Storage: nom "incident-photos", públic per a
-- lectura, escriptura només per a usuaris autenticats).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('incident-photos', 'incident-photos', true)
on conflict (id) do nothing;

create policy "Lectura pública de fotografies" on storage.objects
  for select using (bucket_id = 'incident-photos');

create policy "Usuaris autenticats pugen fotografies" on storage.objects
  for insert to authenticated with check (bucket_id = 'incident-photos');
