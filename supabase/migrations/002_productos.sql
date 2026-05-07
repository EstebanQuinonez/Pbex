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
  color text,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists producto_set_updated_at on public.producto;
create trigger producto_set_updated_at
before update on public.producto
for each row
execute function public.set_updated_at();

-- Especificaciones de inyeccion (1:1 con producto)
create table if not exists public.espec_inyeccion (
  id bigint generated always as identity primary key,
  producto_id bigint not null unique references public.producto (id) on delete cascade,
  peso_g_nominal text,
  peso_g_tolerancia text,
  diam_exterior_mm_nominal text,
  diam_exterior_mm_tolerancia text,
  diam_interior_mm_nominal text,
  diam_interior_mm_tolerancia text,
  alto_largo_mm_nominal text,
  alto_largo_mm_tolerancia text,
  ancho_mm_nominal text,
  ancho_mm_tolerancia text,
  espesor_pared_mm_nominal text,
  espesor_pared_mm_tolerancia text,
  espesor_preco_mm_nominal text,
  espesor_preco_mm_tolerancia text,
  diam_ext_sin_hilo_mm_nominal text,
  diam_ext_sin_hilo_mm_tolerancia text
);

-- Especificaciones de soplado (1:1 con producto)
create table if not exists public.espec_soplado (
  id bigint generated always as identity primary key,
  producto_id bigint not null unique references public.producto (id) on delete cascade,
  peso_g text,
  peso_tolerancia text,
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

create policy "inyeccion_select_auth"
  on public.espec_inyeccion for select
  using (auth.role() = 'authenticated');
create policy "inyeccion_insert_auth"
  on public.espec_inyeccion for insert
  with check (auth.role() = 'authenticated');
create policy "inyeccion_update_auth"
  on public.espec_inyeccion for update
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
