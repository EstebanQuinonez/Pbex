-- Catálogos industriales y pedidos — alineado con 002_productos.sql:
--   - PK: bigint generated always as identity
--   - Dominios cerrados: text + check (mismo estilo que producto.estado)
--   - FK a línea: columna linea_id → public.linea_produccion (id), como en public.producto
--   - Códigos únicos: mismo patrón que producto.codigo
--
-- No modifica: producto, eventos, linea_produccion, material, espec_inyeccion, espec_soplado.
--
-- Compatibilidad eventos (003): maquina_id, cliente_id y pedido_id son bigint → pueden apuntar
-- a maquinas.id, clientes.id y pedidos.id tras añadir FKs en una migración futura (opcional).

begin;

-- ---------------------------------------------------------------------------
-- 7) defectos_producto — catálogo DEFECT_RECORDED (misma familia de PK que material / producto)
-- ---------------------------------------------------------------------------
create table if not exists public.defectos_producto (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  constraint defectos_producto_nombre_nonempty check (length(trim(nombre)) > 0)
);

-- ---------------------------------------------------------------------------
-- 8) fallas_maquina — catálogo MACHINE_FAILURE_RECORDED
-- ---------------------------------------------------------------------------
create table if not exists public.fallas_maquina (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  constraint fallas_maquina_nombre_nonempty check (length(trim(nombre)) > 0)
);

-- ---------------------------------------------------------------------------
-- 1) maquinas — misma línea que producto (linea_id → linea_produccion)
-- ---------------------------------------------------------------------------
create table if not exists public.maquinas (
  id bigint generated always as identity primary key,
  nombre text not null,
  codigo text not null unique,
  tipo text not null check (tipo in ('INYECCION', 'SOPLADO')),
  linea_id bigint not null references public.linea_produccion (id),
  estado text not null default 'activa' check (estado in ('activa', 'mantenimiento', 'inactiva')),
  fecha_registro timestamptz not null default now(),
  constraint maquinas_nombre_nonempty check (length(trim(nombre)) > 0),
  constraint maquinas_codigo_nonempty check (length(trim(codigo)) > 0)
);

-- ---------------------------------------------------------------------------
-- 2) operarios
-- ---------------------------------------------------------------------------
create table if not exists public.operarios (
  id bigint generated always as identity primary key,
  nombre text not null,
  dni text,
  turno text not null check (turno in ('A', 'B')),
  tipo text not null check (tipo in ('INYECCION', 'SOPLADO')),
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  fecha_registro timestamptz not null default now(),
  constraint operarios_nombre_nonempty check (length(trim(nombre)) > 0)
);

create unique index if not exists operarios_dni_unique on public.operarios (dni) where dni is not null;

-- ---------------------------------------------------------------------------
-- 3) encargados_linea — linea_id coherente con producto.linea_id
-- ---------------------------------------------------------------------------
create table if not exists public.encargados_linea (
  id bigint generated always as identity primary key,
  nombre text not null,
  linea_id bigint not null references public.linea_produccion (id),
  turno text not null check (turno in ('A', 'B')),
  tipo_linea text not null check (tipo_linea in ('INYECCION', 'SOPLADO')),
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  fecha_registro timestamptz not null default now(),
  constraint encargados_linea_nombre_nonempty check (length(trim(nombre)) > 0)
);

create index if not exists encargados_linea_linea_idx on public.encargados_linea (linea_id);

-- ---------------------------------------------------------------------------
-- 4) clientes
-- ---------------------------------------------------------------------------
create table if not exists public.clientes (
  id bigint generated always as identity primary key,
  nombre text not null,
  ruc text,
  direccion text,
  telefono text,
  email text,
  fecha_registro timestamptz not null default now(),
  constraint clientes_nombre_nonempty check (length(trim(nombre)) > 0)
);

create unique index if not exists clientes_ruc_unique on public.clientes (ruc) where ruc is not null;

-- ---------------------------------------------------------------------------
-- 5) vendedores
-- ---------------------------------------------------------------------------
create table if not exists public.vendedores (
  id bigint generated always as identity primary key,
  nombre text not null,
  telefono text,
  email text,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  fecha_registro timestamptz not null default now(),
  constraint vendedores_nombre_nonempty check (length(trim(nombre)) > 0)
);

-- ---------------------------------------------------------------------------
-- 6) pedidos — producto_id igual que espec_*: bigint → public.producto (id)
-- ---------------------------------------------------------------------------
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references public.clientes (id),
  producto_id bigint not null references public.producto (id),
  vendedor_id bigint not null references public.vendedores (id),
  cantidad integer not null check (cantidad > 0),
  fecha_pedido timestamptz not null default now(),
  fecha_entrega date,
  estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO')),
  observaciones text,
  fecha_registro timestamptz not null default now()
);

create index if not exists pedidos_cliente_idx on public.pedidos (cliente_id);
create index if not exists pedidos_producto_idx on public.pedidos (producto_id);
create index if not exists pedidos_vendedor_idx on public.pedidos (vendedor_id);
create index if not exists pedidos_estado_fecha_idx on public.pedidos (estado, fecha_pedido desc);

-- ---------------------------------------------------------------------------
-- Índices (análogos a producto_linea_idx / producto_estado_idx)
-- ---------------------------------------------------------------------------
create index if not exists maquinas_linea_idx on public.maquinas (linea_id);
create index if not exists maquinas_estado_idx on public.maquinas (estado);
create index if not exists maquinas_tipo_idx on public.maquinas (tipo);
create index if not exists operarios_turno_tipo_idx on public.operarios (turno, tipo);

-- ---------------------------------------------------------------------------
-- Semillas catálogos (idempotente)
-- ---------------------------------------------------------------------------
insert into public.defectos_producto (nombre)
values
  ('manchas'),
  ('incompletos'),
  ('color'),
  ('rebaba'),
  ('rechazo_calidad')
on conflict (nombre) do nothing;

insert into public.fallas_maquina (nombre)
values
  ('lubricacion'),
  ('motor'),
  ('sistema_electrico')
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------------
-- RLS — mismo criterio que 002 (auth.role() = 'authenticated')
-- ---------------------------------------------------------------------------
alter table public.defectos_producto enable row level security;
alter table public.fallas_maquina enable row level security;
alter table public.maquinas enable row level security;
alter table public.operarios enable row level security;
alter table public.encargados_linea enable row level security;
alter table public.clientes enable row level security;
alter table public.vendedores enable row level security;
alter table public.pedidos enable row level security;

drop policy if exists "defectos_producto_select_auth" on public.defectos_producto;
drop policy if exists "defectos_producto_insert_auth" on public.defectos_producto;
drop policy if exists "defectos_producto_update_auth" on public.defectos_producto;
drop policy if exists "defectos_producto_delete_auth" on public.defectos_producto;
drop policy if exists "fallas_maquina_select_auth" on public.fallas_maquina;
drop policy if exists "fallas_maquina_insert_auth" on public.fallas_maquina;
drop policy if exists "fallas_maquina_update_auth" on public.fallas_maquina;
drop policy if exists "fallas_maquina_delete_auth" on public.fallas_maquina;
drop policy if exists "maquinas_select_auth" on public.maquinas;
drop policy if exists "maquinas_insert_auth" on public.maquinas;
drop policy if exists "maquinas_update_auth" on public.maquinas;
drop policy if exists "maquinas_delete_auth" on public.maquinas;
drop policy if exists "operarios_select_auth" on public.operarios;
drop policy if exists "operarios_insert_auth" on public.operarios;
drop policy if exists "operarios_update_auth" on public.operarios;
drop policy if exists "operarios_delete_auth" on public.operarios;
drop policy if exists "encargados_linea_select_auth" on public.encargados_linea;
drop policy if exists "encargados_linea_insert_auth" on public.encargados_linea;
drop policy if exists "encargados_linea_update_auth" on public.encargados_linea;
drop policy if exists "encargados_linea_delete_auth" on public.encargados_linea;
drop policy if exists "clientes_select_auth" on public.clientes;
drop policy if exists "clientes_insert_auth" on public.clientes;
drop policy if exists "clientes_update_auth" on public.clientes;
drop policy if exists "clientes_delete_auth" on public.clientes;
drop policy if exists "vendedores_select_auth" on public.vendedores;
drop policy if exists "vendedores_insert_auth" on public.vendedores;
drop policy if exists "vendedores_update_auth" on public.vendedores;
drop policy if exists "vendedores_delete_auth" on public.vendedores;
drop policy if exists "pedidos_select_auth" on public.pedidos;
drop policy if exists "pedidos_insert_auth" on public.pedidos;
drop policy if exists "pedidos_update_auth" on public.pedidos;
drop policy if exists "pedidos_delete_auth" on public.pedidos;

create policy "defectos_producto_select_auth" on public.defectos_producto for select using (auth.role() = 'authenticated');
create policy "defectos_producto_insert_auth" on public.defectos_producto for insert with check (auth.role() = 'authenticated');
create policy "defectos_producto_update_auth" on public.defectos_producto for update using (auth.role() = 'authenticated');
create policy "defectos_producto_delete_auth" on public.defectos_producto for delete using (auth.role() = 'authenticated');

create policy "fallas_maquina_select_auth" on public.fallas_maquina for select using (auth.role() = 'authenticated');
create policy "fallas_maquina_insert_auth" on public.fallas_maquina for insert with check (auth.role() = 'authenticated');
create policy "fallas_maquina_update_auth" on public.fallas_maquina for update using (auth.role() = 'authenticated');
create policy "fallas_maquina_delete_auth" on public.fallas_maquina for delete using (auth.role() = 'authenticated');

create policy "maquinas_select_auth" on public.maquinas for select using (auth.role() = 'authenticated');
create policy "maquinas_insert_auth" on public.maquinas for insert with check (auth.role() = 'authenticated');
create policy "maquinas_update_auth" on public.maquinas for update using (auth.role() = 'authenticated');
create policy "maquinas_delete_auth" on public.maquinas for delete using (auth.role() = 'authenticated');

create policy "operarios_select_auth" on public.operarios for select using (auth.role() = 'authenticated');
create policy "operarios_insert_auth" on public.operarios for insert with check (auth.role() = 'authenticated');
create policy "operarios_update_auth" on public.operarios for update using (auth.role() = 'authenticated');
create policy "operarios_delete_auth" on public.operarios for delete using (auth.role() = 'authenticated');

create policy "encargados_linea_select_auth" on public.encargados_linea for select using (auth.role() = 'authenticated');
create policy "encargados_linea_insert_auth" on public.encargados_linea for insert with check (auth.role() = 'authenticated');
create policy "encargados_linea_update_auth" on public.encargados_linea for update using (auth.role() = 'authenticated');
create policy "encargados_linea_delete_auth" on public.encargados_linea for delete using (auth.role() = 'authenticated');

create policy "clientes_select_auth" on public.clientes for select using (auth.role() = 'authenticated');
create policy "clientes_insert_auth" on public.clientes for insert with check (auth.role() = 'authenticated');
create policy "clientes_update_auth" on public.clientes for update using (auth.role() = 'authenticated');
create policy "clientes_delete_auth" on public.clientes for delete using (auth.role() = 'authenticated');

create policy "vendedores_select_auth" on public.vendedores for select using (auth.role() = 'authenticated');
create policy "vendedores_insert_auth" on public.vendedores for insert with check (auth.role() = 'authenticated');
create policy "vendedores_update_auth" on public.vendedores for update using (auth.role() = 'authenticated');
create policy "vendedores_delete_auth" on public.vendedores for delete using (auth.role() = 'authenticated');

create policy "pedidos_select_auth" on public.pedidos for select using (auth.role() = 'authenticated');
create policy "pedidos_insert_auth" on public.pedidos for insert with check (auth.role() = 'authenticated');
create policy "pedidos_update_auth" on public.pedidos for update using (auth.role() = 'authenticated');
create policy "pedidos_delete_auth" on public.pedidos for delete using (auth.role() = 'authenticated');

commit;
