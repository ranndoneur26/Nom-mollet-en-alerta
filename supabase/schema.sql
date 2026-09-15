-- =============================================================================
-- MOLLET EN ALERTA — Esquema de base de dades (Supabase / PostgreSQL)
-- Executa aquest fitxer al SQL Editor de Supabase (o via `supabase db push`)
-- ABANS de supabase/policies.sql i supabase/seed.sql.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Tipus enumerats
-- ---------------------------------------------------------------------------
do $$ begin
  create type incident_status as enum (
    'moderacio','pendent','estudi','assignada','tramitacio',
    'resolta','tancada','fora','duplicada','rebutjada'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type urgency_level as enum ('normal','important','urgent','risc');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum
    ('citizen','moderator','gestor','regidor','tecnic','consulta','admin','superadmin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- PROFILES — dades públiques de l'usuari. El correu viu NOMÉS a auth.users,
-- mai es copia aquí, per garantir que mai es pugui exposar públicament.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text unique not null,
  role user_role not null default 'citizen',
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crea automàticament un perfil (amb àlies temporal) quan es registra un usuari.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, alias)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'alias', '@MolletVei' || substr(new.id::text, 1, 6))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Taules de referència (barris, àrees, regidors/es, categories)
-- ---------------------------------------------------------------------------
create table if not exists public.neighborhoods (
  id text primary key,
  name text not null,
  lat numeric,
  lng numeric
  -- Substituir per geom geography(Polygon,4326) quan hi hagi un GeoJSON oficial.
);

create table if not exists public.municipal_areas (
  id serial primary key,
  name text not null unique
);

create table if not exists public.councillors (
  id serial primary key,
  full_name text not null,
  party text,
  role_title text,
  areas text[] not null default '{}',
  neighborhoods text[] not null default '{}',
  official_email text,
  official_url text
);

create table if not exists public.categories (
  id serial primary key,
  name text not null unique,
  default_area_id int references public.municipal_areas(id),
  default_councillor_id int references public.councillors(id)
);

create table if not exists public.subcategories (
  id serial primary key,
  category_id int not null references public.categories(id) on delete cascade,
  name text not null,
  unique (category_id, name)
);

-- ---------------------------------------------------------------------------
-- INCIDENTS
-- ---------------------------------------------------------------------------
create sequence if not exists public.incident_seq start 1;

create table if not exists public.incidents (
  id uuid primary key default uuid_generate_v4(),
  public_id text unique not null default (
    'MOL-' || lpad(nextval('public.incident_seq')::text, 5, '0')
  ),
  title text not null,
  description text not null default '',
  category_id int references public.categories(id),
  subcategory_id int references public.subcategories(id),
  latitude numeric not null,
  longitude numeric not null,
  address text not null default '',
  neighborhood_id text references public.neighborhoods(id),
  status incident_status not null default 'moderacio',
  urgency urgency_level not null default 'normal',
  priority text not null default 'MITJANA',
  author_id uuid references public.profiles(id),
  assigned_area_id int references public.municipal_areas(id),
  assigned_councillor_id int references public.councillors(id),
  support_count int not null default 0,
  duplicate_of uuid references public.incidents(id),
  resolution_date timestamptz,
  resolution_description text,
  admin_response text,
  estimated_resolution_date date,
  out_of_scope_body text,
  is_demo boolean not null default false,
  demo_author_alias text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_status_idx on public.incidents(status);
create index if not exists incidents_neighborhood_idx on public.incidents(neighborhood_id);
create index if not exists incidents_category_idx on public.incidents(category_id);
create index if not exists incidents_created_idx on public.incidents(created_at desc);

create table if not exists public.photos (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text not null,
  is_official boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.supports (
  incident_id uuid not null references public.incidents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (incident_id, user_id)
);

create table if not exists public.status_history (
  id bigserial primary key,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  old_status incident_status,
  new_status incident_status not null,
  note text,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id bigserial primary key,
  period_type text not null check (period_type in ('month','year')),
  period_value text not null,
  generated_at timestamptz not null default now(),
  file_url text
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funcions auxiliars
-- ---------------------------------------------------------------------------

-- Barri més proper per coordenades (fins que hi hagi polígons oficials).
create or replace function public.nearest_neighborhood(p_lat numeric, p_lng numeric)
returns text
language sql stable
as $$
  select id from public.neighborhoods
  order by ((lat - p_lat)^2 + (lng - p_lng)^2) asc
  limit 1;
$$;

-- Comprova si l'usuari actual té un rol de gestió (moderador o superior).
create or replace function public.is_staff(uid uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('moderator','gestor','regidor','tecnic','admin','superadmin')
  );
$$;

-- Abans d'inserir: assigna barri, categoria per defecte i area/regidor.
create or replace function public.incidents_before_insert()
returns trigger
language plpgsql
as $$
declare
  cat record;
begin
  if new.neighborhood_id is null then
    new.neighborhood_id := public.nearest_neighborhood(new.latitude, new.longitude);
  end if;

  if new.category_id is not null then
    select default_area_id, default_councillor_id into cat
    from public.categories where id = new.category_id;
    if new.assigned_area_id is null then new.assigned_area_id := cat.default_area_id; end if;
    if new.assigned_councillor_id is null then new.assigned_councillor_id := cat.default_councillor_id; end if;
  end if;

  new.priority := case new.urgency
    when 'risc' then 'CRITICA'
    when 'urgent' then 'ALTA'
    else 'MITJANA'
  end;

  return new;
end;
$$;

drop trigger if exists trg_incidents_before_insert on public.incidents;
create trigger trg_incidents_before_insert
  before insert on public.incidents
  for each row execute function public.incidents_before_insert();

-- En cada UPDATE d'estat: actualitza updated_at, registra a l'historial i
-- crea una notificació per a l'autor/a.
create or replace function public.incidents_after_status_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at := now();

  if new.status is distinct from old.status then
    insert into public.status_history (incident_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());

    if new.status in ('resolta','tancada') and new.resolution_date is null then
      new.resolution_date := now();
    end if;

    if new.author_id is not null then
      insert into public.notifications (user_id, incident_id, message)
      values (
        new.author_id, new.id,
        'La teva incidència ' || new.public_id || ' ha canviat d''estat a: ' || new.status::text
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_incidents_before_update on public.incidents;
create trigger trg_incidents_before_update
  before update on public.incidents
  for each row execute function public.incidents_after_status_update();

-- Manté support_count sincronitzat amb la taula supports.
create or replace function public.supports_after_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.incidents
  set support_count = (select count(*) from public.supports where incident_id = coalesce(new.incident_id, old.incident_id))
  where id = coalesce(new.incident_id, old.incident_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_supports_after_insert on public.supports;
create trigger trg_supports_after_insert
  after insert or delete on public.supports
  for each row execute function public.supports_after_change();

-- Fusiona una incidència "source" dins de "target": combina suports (sense
-- duplicar per usuari), trasllada comentaris i marca l'origen com a duplicada.
create or replace function public.merge_incidents(p_source uuid, p_target uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Només el personal de moderació pot fusionar incidències';
  end if;

  insert into public.supports (incident_id, user_id)
  select p_target, user_id from public.supports where incident_id = p_source
  on conflict do nothing;

  update public.comments set incident_id = p_target where incident_id = p_source;

  update public.incidents
  set status = 'duplicada', duplicate_of = p_target, updated_at = now()
  where id = p_source;

  insert into public.status_history (incident_id, old_status, new_status, changed_by, note)
  values (p_source, (select status from public.incidents where id = p_source), 'duplicada', auth.uid(),
          'Fusionada amb ' || (select public_id from public.incidents where id = p_target));

  insert into public.audit_log (actor_id, action, entity, entity_id, new_value)
  values (auth.uid(), 'merge_incidents', 'incidents', p_source::text, jsonb_build_object('target', p_target));
end;
$$;

-- Auditoria automàtica de qualsevol canvi d'estat administratiu.
create or replace function public.audit_incident_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (old.status is distinct from new.status) or (old.assigned_area_id is distinct from new.assigned_area_id) then
    insert into public.audit_log (actor_id, action, entity, entity_id, old_value, new_value)
    values (
      auth.uid(), 'update_incident', 'incidents', new.id::text,
      jsonb_build_object('status', old.status, 'assigned_area_id', old.assigned_area_id),
      jsonb_build_object('status', new.status, 'assigned_area_id', new.assigned_area_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_incidents on public.incidents;
create trigger trg_audit_incidents
  after update on public.incidents
  for each row execute function public.audit_incident_changes();
