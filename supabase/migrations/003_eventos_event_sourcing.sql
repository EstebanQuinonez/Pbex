-- Evolución de public.eventos hacia event sourcing híbrido (columnas + payload jsonb).
-- Requisitos previos: 001_eventos.sql y 002_productos.sql ya aplicados (debe existir public.producto).
-- No elimina la tabla ni modifica public.producto.
-- La columna "timestamp" va entre comillas porque TIMESTAMP es palabra reservada en SQL.

begin;

-- ---------------------------------------------------------------------------
-- 1. Índices antiguos (referencian created_at / tipo)
-- ---------------------------------------------------------------------------
drop index if exists public.eventos_user_created_idx;
drop index if exists public.eventos_tipo_idx;

-- ---------------------------------------------------------------------------
-- 2. Quitar CHECK legado sobre tipo (nombre típico en PostgreSQL)
-- ---------------------------------------------------------------------------
alter table public.eventos drop constraint if exists eventos_tipo_check;

-- ---------------------------------------------------------------------------
-- 3. Renombrar columnas solo si aún no se migró (re-ejecución segura)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'eventos' and column_name = 'tipo'
  ) then
    alter table public.eventos rename column tipo to type;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'eventos' and column_name = 'created_at'
  ) then
    alter table public.eventos rename column created_at to "timestamp";
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Relaciones y datos operativos (NULL = no aplica / legado solo-payload)
-- ---------------------------------------------------------------------------
alter table public.eventos add column if not exists producto_id bigint
  references public.producto (id) on delete set null;

alter table public.eventos add column if not exists maquina_id bigint;
alter table public.eventos add column if not exists operario_id uuid
  references auth.users (id) on delete set null;
alter table public.eventos add column if not exists encargado_id uuid
  references auth.users (id) on delete set null;
alter table public.eventos add column if not exists cliente_id bigint;
alter table public.eventos add column if not exists pedido_id bigint;
alter table public.eventos add column if not exists vendedor_id uuid
  references auth.users (id) on delete set null;

alter table public.eventos add column if not exists turno text;
alter table public.eventos add column if not exists cantidad numeric;
alter table public.eventos add column if not exists merma numeric;
alter table public.eventos add column if not exists defecto text;
alter table public.eventos add column if not exists falla_maquina text;

-- ---------------------------------------------------------------------------
-- 5. CHECK de dominio (reemplaza el legado de tipo)
-- ---------------------------------------------------------------------------
alter table public.eventos drop constraint if exists eventos_type_check;
alter table public.eventos add constraint eventos_type_check check (
  type in (
    'PRODUCTION_RECORDED',
    'MERMA_RECORDED',
    'DEFECT_RECORDED',
    'MACHINE_FAILURE_RECORDED',
    'ORDER_CREATED',
    'ORDER_COMPLETED'
  )
);

alter table public.eventos drop constraint if exists eventos_turno_check;
alter table public.eventos add constraint eventos_turno_check check (
  turno is null or turno in ('A', 'B')
);

alter table public.eventos drop constraint if exists eventos_defecto_check;
alter table public.eventos add constraint eventos_defecto_check check (
  defecto is null
  or defecto in (
    'manchas',
    'incompletos',
    'color',
    'rebaba',
    'rechazo_calidad'
  )
);

alter table public.eventos drop constraint if exists eventos_falla_maquina_check;
alter table public.eventos add constraint eventos_falla_maquina_check check (
  falla_maquina is null
  or falla_maquina in ('lubricacion', 'motor', 'sistema_electrico')
);

-- ---------------------------------------------------------------------------
-- 6. Índices para KPIs y listados
-- ---------------------------------------------------------------------------
create index if not exists eventos_user_ts_idx
  on public.eventos (user_id, "timestamp" desc);

create index if not exists eventos_type_idx
  on public.eventos (type);

create index if not exists eventos_timestamp_idx
  on public.eventos ("timestamp" desc);

create index if not exists eventos_producto_id_idx
  on public.eventos (producto_id)
  where producto_id is not null;

create index if not exists eventos_maquina_id_idx
  on public.eventos (maquina_id)
  where maquina_id is not null;

-- ---------------------------------------------------------------------------
-- 7. (Opcional) Backfill desde payload legado — descomenta si quieres rellenar columnas
-- ---------------------------------------------------------------------------
-- update public.eventos e
-- set
--   cantidad = coalesce(e.cantidad, (e.payload->>'produccion_total')::numeric),
--   merma = coalesce(
--     e.merma,
--     case
--       when e.payload ? 'porcentaje_desperdicio' and (e.payload->>'produccion_total') ~ '^[0-9]+(\.[0-9]+)?$'
--       then round(
--         (e.payload->>'produccion_total')::numeric * (e.payload->>'porcentaje_desperdicio')::numeric / 100.0,
--         4
--       )
--       else null
--     end
--   ),
--   turno = coalesce(e.turno, nullif(upper(trim(e.payload->>'turno')), ''))
-- where e.type = 'PRODUCTION_RECORDED';
--
-- update public.eventos e
-- set cantidad = coalesce(e.cantidad, (e.payload->>'cantidad')::numeric)
-- where e.type = 'DEFECT_RECORDED' and e.payload ? 'cantidad';

commit;
