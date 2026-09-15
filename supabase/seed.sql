-- =============================================================================
-- MOLLET EN ALERTA — Dades de referència i de demostració
-- Font de la investigació prèvia (Fase 0, 12/09/2026): cartipàs municipal
-- vigent i plànol de barris a molletvalles.cat. Vegeu README.md > Fase 0.
-- Les coordenades de barri són centroides aproximats, NO polígons oficials.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Barris (12, amb regidor/a de barri assignat segons cartipàs vigent)
-- ---------------------------------------------------------------------------
insert into public.neighborhoods (id, name, lat, lng) values
  ('centre',        'Centre / Zona Centre',   41.5399, 2.2140),
  ('col-nous',      'Col·legis Nous',         41.5433, 2.2110),
  ('est-franca',    'Estació de França',      41.5445, 2.2065),
  ('can-pantiquet', 'Can Pantiquet',          41.5368, 2.2088),
  ('plana-lledo',   'Plana Lledó',            41.5355, 2.2175),
  ('lourdes',       'Lourdes',                41.5460, 2.2135),
  ('can-borrell',   'Can Borrell',            41.5330, 2.2150),
  ('riera-seca',    'Riera Seca',             41.5410, 2.1980),
  ('santa-rosa',    'Santa Rosa',             41.5300, 2.2100),
  ('est-nord',      'Estació del Nord',       41.5470, 2.2010),
  ('calderi',       'El Calderí',             41.5480, 2.2160),
  ('casilla',       'La Casilla',             41.5375, 2.2050)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Àrees municipals de referència
-- ---------------------------------------------------------------------------
insert into public.municipal_areas (name) values
  ('Paisatge Urbà i Manteniment de l''Espai Públic'),
  ('Gestió de Residus'),
  ('Mobilitat i Seguretat Viària'),
  ('Planificació Urbanística / Disciplina Urbanística'),
  ('Justícia Ambiental i Ecologisme'),
  ('Seguretat Ciutadana i Protecció Civil / Civisme'),
  ('Manteniment dels Equipaments Municipals'),
  ('Serveis Personals (Educació, Serveis Socials, Cultura, Esports, etc.)')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Cartipàs municipal vigent (mandat 2023-2027, actualitzat 03/02/2026)
-- Font: https://www.molletvalles.cat/ca/l-ajuntament/organitzacio-municipal/govern-municipal
-- ---------------------------------------------------------------------------
insert into public.councillors (full_name, party, role_title, areas, neighborhoods) values
  ('Mireia Dionisio Calé', 'PSC', 'Alcaldessa',
    array['Relacions Institucionals','Gabinet d''Alcaldia'], array[]::text[]),
  ('Raúl Broto Cervera', 'PSC', '1r tinent d''alcaldessa',
    array['Economia','Recursos Humans','Planificació Urbanística','Projectes Urbans i Obra Pública','Espai Rural de Gallecs'], array[]::text[]),
  ('Mercè Pérez Piedrafita', 'PSC', '2a tinenta d''alcaldessa',
    array['Cultura','Comerç i Mercats','Atenció a la Ciutadania'], array[]::text[]),
  ('Marina Escribano Maspons', 'Mollet En Comú Podem', '3a tinenta d''alcaldessa',
    array['Habitatge','Joventut','Transició Energètica'], array['Santa Rosa']),
  ('Encarna Ortiz Jurado', 'PSC', '4a tinenta d''alcaldessa',
    array['Benestar Animal','Ocupació','Consum','Transparència','Promoció Empresarial i Polígons'], array['Riera Seca']),
  ('Juan José Baños González', 'PSC', '5è tinent d''alcaldessa',
    array['Cicle de l''Aigua i Enllumenat Públic','Seguretat Ciutadana i Protecció Civil','Mobilitat i Seguretat Viària','Manteniment dels Equipaments Municipals'], array['Estació del Nord']),
  ('Ferran Segarra Sánchez', 'PSC', '6è tinent d''alcaldessa',
    array['Gestió i Disciplina Urbanística','TIC i Administració Electrònica','Justícia Ambiental i Ecologisme','Paisatge Urbà i Manteniment de l''Espai Públic','LGTBI'], array['Can Borrell']),
  ('Laura Jara Lorente', 'PSC', '7a tinenta d''alcaldessa',
    array['Educació','Serveis Socials','Cohesió Social'], array['Plana Lledó']),
  ('Estela Mas Cagide', 'PSC', 'Regidora',
    array['Infància','Feminisme','Participació','Turisme i Promoció de la Ciutat'], array[]::text[]),
  ('Leo Conde García', 'PSC-Independent', 'Regidor',
    array['Esports','Innovació i Emprenedoria'], array[]::text[]),
  ('Pepi Muñoz Pareja', 'PSC-Independent', 'Regidora',
    array['Salut Pública','Gent Gran'], array[]::text[]),
  ('Francisco Paradas Atroche', 'PSC', 'Coordinador de barris',
    array[]::text[], array['Lourdes','Estació de França','El Calderí']),
  ('Santiago Plaza Olivares', 'PSC', 'Regidor',
    array['Gestió de Residus','Ciutadania i Relacions amb les Comunitats'], array['Zona Centre','Col·legis Nous']),
  ('David Moreno Muñoz', 'Mollet En Comú Podem', 'Regidor',
    array['Civisme','Cooperació i Solidaritat'], array[]::text[]),
  ('Maria Carmen Moya Hidalgo', 'Mollet En Comú Podem', 'Regidora',
    array['Accessibilitat Universal'], array['Can Pantiquet','La Casilla']);

-- ---------------------------------------------------------------------------
-- Categories i subcategories (taxonomia pròpia, vegeu README > Fase 0)
-- amb l'àrea i regidor/a de referència assignats per defecte.
-- ---------------------------------------------------------------------------
do $$
declare
  a_espai int; a_residus int; a_mobilitat int; a_urbanisme int;
  a_ambient int; a_seguretat int; a_equip int; a_serveis int;
  c_segarra int; c_plaza int; c_banos int; c_broto int; c_jara int;
  c_conde int; c_escribano int; c_munoz int; c_perez int; c_moreno int; c_moya int;
  cat_id int;
begin
  select id into a_espai from public.municipal_areas where name = 'Paisatge Urbà i Manteniment de l''Espai Públic';
  select id into a_residus from public.municipal_areas where name = 'Gestió de Residus';
  select id into a_mobilitat from public.municipal_areas where name = 'Mobilitat i Seguretat Viària';
  select id into a_urbanisme from public.municipal_areas where name = 'Planificació Urbanística / Disciplina Urbanística';
  select id into a_ambient from public.municipal_areas where name = 'Justícia Ambiental i Ecologisme';
  select id into a_seguretat from public.municipal_areas where name = 'Seguretat Ciutadana i Protecció Civil / Civisme';
  select id into a_equip from public.municipal_areas where name = 'Manteniment dels Equipaments Municipals';
  select id into a_serveis from public.municipal_areas where name = 'Serveis Personals (Educació, Serveis Socials, Cultura, Esports, etc.)';

  select id into c_segarra from public.councillors where full_name = 'Ferran Segarra Sánchez';
  select id into c_plaza from public.councillors where full_name = 'Santiago Plaza Olivares';
  select id into c_banos from public.councillors where full_name = 'Juan José Baños González';
  select id into c_broto from public.councillors where full_name = 'Raúl Broto Cervera';
  select id into c_jara from public.councillors where full_name = 'Laura Jara Lorente';
  select id into c_conde from public.councillors where full_name = 'Leo Conde García';
  select id into c_escribano from public.councillors where full_name = 'Marina Escribano Maspons';
  select id into c_munoz from public.councillors where full_name = 'Pepi Muñoz Pareja';
  select id into c_perez from public.councillors where full_name = 'Mercè Pérez Piedrafita';
  select id into c_moreno from public.councillors where full_name = 'David Moreno Muñoz';
  select id into c_moya from public.councillors where full_name = 'Maria Carmen Moya Hidalgo';

  insert into public.categories (name, default_area_id, default_councillor_id) values
    ('ESPAI PÚBLIC', a_espai, c_segarra),
    ('NETEJA I RESIDUS', a_residus, c_plaza),
    ('PARCS I JARDINS', a_espai, c_segarra),
    ('MOBILITAT', a_mobilitat, c_banos),
    ('URBANISME', a_urbanisme, c_broto),
    ('MEDI AMBIENT', a_ambient, c_segarra),
    ('SEGURETAT I CIVISME', a_seguretat, c_banos),
    ('EQUIPAMENTS', a_equip, c_banos),
    ('SERVEIS MUNICIPALS', a_serveis, c_perez)
  on conflict (name) do nothing;

  -- Subcategories (amb override de regidor/a per a algunes, gestionat a nivell d'aplicació
  -- via la taula categories; per simplicitat el MVP assigna a nivell de categoria).
  for cat_id in
    select id from public.categories where name = 'ESPAI PÚBLIC'
  loop
    insert into public.subcategories (category_id, name)
    values (cat_id,'Asfalt'),(cat_id,'Voreres'),(cat_id,'Vorades'),(cat_id,'Clavegueram'),
           (cat_id,'Mobiliari urbà'),(cat_id,'Papereres'),(cat_id,'Bancs'),(cat_id,'Fonts'),(cat_id,'Pilones')
    on conflict do nothing;
  end loop;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Neteja viària','Contenidors','Residus abandonats','Recollida de mobles','Papereres plenes','Abocaments'
    ]) as s where name = 'NETEJA I RESIDUS' on conflict do nothing;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Arbres','Branques perilloses','Poda','Gespa','Reg','Jardineres','Parcs infantils','Manteniment de zones verdes'
    ]) as s where name = 'PARCS I JARDINS' on conflict do nothing;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Trànsit','Aparcament','Zona blava','Transport públic','Bicicletes','Carrils bici','Vianants','Semàfors','Senyalització'
    ]) as s where name = 'MOBILITAT' on conflict do nothing;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Obres','Edificis abandonats','Façanes','Planejament','Accessibilitat','Altres problemes urbanístics'
    ]) as s where name = 'URBANISME' on conflict do nothing;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Soroll','Contaminació','Plagues','Qualitat de l''aire','Aigua','Arbrat','Biodiversitat'
    ]) as s where name = 'MEDI AMBIENT' on conflict do nothing;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Seguretat','Incivisme','Conflictes a l''espai públic','Ocupació indeguda','Altres'
    ]) as s where name = 'SEGURETAT I CIVISME' on conflict do nothing;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Esportius','Educatius','Culturals','Biblioteques','Centres cívics','Altres'
    ]) as s where name = 'EQUIPAMENTS' on conflict do nothing;

  insert into public.subcategories (category_id, name)
    select id, s from public.categories, unnest(array[
      'Atenció ciutadana','Serveis socials','Cultura','Esports','Educació','Joventut','Gent gran','Salut pública','Altres'
    ]) as s where name = 'SERVEIS MUNICIPALS' on conflict do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- Incidències de DEMOSTRACIÓ (is_demo = true). Mai representen dades reals.
-- Es generen ~40 files amb valors variats per poder provar el dashboard.
-- Author_id és NULL (no hi ha usuaris demo reals); es mostra "demo_author_alias".
-- ---------------------------------------------------------------------------
do $$
declare
  cats text[] := array['ESPAI PÚBLIC','NETEJA I RESIDUS','PARCS I JARDINS','MOBILITAT','URBANISME','MEDI AMBIENT','SEGURETAT I CIVISME','EQUIPAMENTS','SERVEIS MUNICIPALS'];
  hoods text[] := array['centre','col-nous','est-franca','can-pantiquet','plana-lledo','lourdes','can-borrell','riera-seca','santa-rosa','est-nord','calderi','casilla'];
  urgs urgency_level[] := array['normal','important','urgent','risc']::urgency_level[];
  sts incident_status[] := array['pendent','estudi','tramitacio','resolta','tancada','fora']::incident_status[];
  i int;
  h record;
  cat_row record;
  chosen_status incident_status;
  chosen_urgency urgency_level;
  days_ago int;
begin
  for i in 1..40 loop
    select * into h from public.neighborhoods where id = hoods[1 + floor(random()*array_length(hoods,1))::int];
    select * into cat_row from public.categories where name = cats[1 + floor(random()*array_length(cats,1))::int];
    chosen_status := sts[1 + floor(random()*array_length(sts,1))::int];
    chosen_urgency := urgs[1 + floor(random()*array_length(urgs,1))::int];
    days_ago := floor(random()*250)::int;

    insert into public.incidents (
      title, description, category_id, latitude, longitude, address,
      neighborhood_id, status, urgency, assigned_area_id, assigned_councillor_id,
      is_demo, demo_author_alias, created_at, updated_at,
      resolution_date
    ) values (
      'Incidència de demostració — ' || cat_row.name,
      'Incidència de demostració generada automàticament per il·lustrar el funcionament de la plataforma.',
      cat_row.id,
      h.lat + (random()-0.5)*0.006,
      h.lng + (random()-0.5)*0.008,
      'Carrer de demostració, ' || (1 + floor(random()*180))::text || ', ' || h.name,
      h.id, chosen_status, chosen_urgency,
      cat_row.default_area_id, cat_row.default_councillor_id,
      true, '@MolletVei' || (100 + i)::text,
      now() - (days_ago || ' days')::interval,
      now() - (days_ago || ' days')::interval,
      case when chosen_status in ('resolta','tancada') then now() - (greatest(days_ago-14,1) || ' days')::interval else null end
    );
  end loop;
end $$;

-- Nota: en aquest INSERT massiu no s'executa el trigger d'assignació
-- automàtica de barri (neighborhood_id ja s'indica explícitament), però sí
-- que assigna àrea/regidor per defecte des de la pròpia categoria triada.
