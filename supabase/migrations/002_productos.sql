-- Catalogos y productos

create table if not exists public.linea_produccion (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  descripcion text
);

create table if not exists public.material (
  id bigint generated always as identity primary key,
  nombre text not null,
  abreviatura text not null unique
);

create table if not exists public.producto (
  id bigint generated always as identity primary key,
  codigo text not null unique,
  descripcion text not null,
  linea_id bigint not null references public.linea_produccion (id),
  material_id bigint not null references public.material (id),

  estado text not null default 'activo' check (estado in ('activo', 'inactivo'))
);

-- Especificaciones de inyección (1:1 con producto), columnas text
drop table if exists public.espec_inyeccion cascade;
create table public.espec_inyeccion (
  id bigint generated always as identity primary key,
  producto_id bigint not null unique references public.producto (id) on delete cascade,
  peso text,
  diam_exterior_mm text,
  diam_ext_sin_hilo_mm text,
  diam_interior_mm text,
  alto_largo_mm text,
  ancho_mm text,
  espesor_pared_mm text,
  espesor_preco_mm text
);

-- Especificaciones de soplado (1:1 con producto), columnas text
drop table if exists public.espec_soplado cascade;
create table public.espec_soplado (
  id bigint generated always as identity primary key,
  producto_id bigint not null unique references public.producto (id) on delete cascade,
  peso text,
  diam_ext_boca_mm text,
  diam_ext_cuello_mm text,
  diam_int_cuello_mm text,
  altura_boca_mm text
);

-- Indices
create index if not exists producto_linea_idx on public.producto (linea_id);
create index if not exists producto_material_idx on public.producto (material_id);
create index if not exists producto_estado_idx on public.producto (estado);

-- RLS
alter table public.linea_produccion enable row level security;
alter table public.material enable row level security;
alter table public.producto enable row level security;
alter table public.espec_inyeccion enable row level security;
alter table public.espec_soplado enable row level security;

create policy "linea_select_auth"
  on public.linea_produccion for select
  using (auth.role() = 'authenticated');
create policy "linea_insert_auth"
  on public.linea_produccion for insert
  with check (auth.role() = 'authenticated');

create policy "material_select_auth"
  on public.material for select
  using (auth.role() = 'authenticated');
create policy "material_insert_auth"
  on public.material for insert
  with check (auth.role() = 'authenticated');

create policy "producto_select_auth"
  on public.producto for select
  using (auth.role() = 'authenticated');
create policy "producto_insert_auth"
  on public.producto for insert
  with check (auth.role() = 'authenticated');
create policy "producto_update_auth"
  on public.producto for update
  using (auth.role() = 'authenticated');
create policy "producto_delete_auth"
  on public.producto for delete
  using (auth.role() = 'authenticated');

create policy "inyeccion_select_auth"
  on public.espec_inyeccion for select
  using (auth.role() = 'authenticated');
create policy "inyeccion_insert_auth"
  on public.espec_inyeccion for insert
  with check (auth.role() = 'authenticated');
create policy "inyeccion_update_auth"
  on public.espec_inyeccion for update
  using (auth.role() = 'authenticated');
create policy "inyeccion_delete_auth"
  on public.espec_inyeccion for delete
  using (auth.role() = 'authenticated');

create policy "soplado_select_auth"
  on public.espec_soplado for select
  using (auth.role() = 'authenticated');
create policy "soplado_insert_auth"
  on public.espec_soplado for insert
  with check (auth.role() = 'authenticated');
create policy "soplado_update_auth"
  on public.espec_soplado for update
  using (auth.role() = 'authenticated');
create policy "soplado_delete_auth"
  on public.espec_soplado for delete
  using (auth.role() = 'authenticated');
