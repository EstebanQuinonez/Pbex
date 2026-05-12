-- Merma ligada al evento de producción; KPI usa producción neta (bruta − mermas enlazadas).
-- Requisito: migración 006 ya aplicada (fn_kpis_eventos existe).

begin;

alter table public.eventos add column if not exists produccion_evento_id uuid;

do $mig$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_class t on c.conrelid = t.oid
    join pg_catalog.pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'eventos'
      and c.conname = 'eventos_produccion_evento_id_fkey'
  ) then
    alter table public.eventos
      add constraint eventos_produccion_evento_id_fkey
      foreign key (produccion_evento_id) references public.eventos (id) on delete restrict;
  end if;
end $mig$;

create index if not exists eventos_produccion_ref_idx
  on public.eventos (produccion_evento_id)
  where produccion_evento_id is not null;

drop function if exists public.fn_kpis_eventos(timestamptz, timestamptz, bigint, text);

create or replace function public.fn_kpis_eventos(
  p_ts_from timestamptz default null,
  p_ts_to timestamptz default null,
  p_maquina_id bigint default null,
  p_turno text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with base as materialized (
    select
      e.type,
      e."timestamp" as evt_ts,
      e.maquina_id,
      e.producto_id,
      e.turno,
      e.cantidad,
      e.merma,
      e.defecto,
      e.falla_maquina,
      e.payload,
      case
        when e.type = 'PRODUCTION_RECORDED' then
          greatest(
            0::numeric,
            coalesce(e.cantidad, (e.payload ->> 'produccion_total')::numeric, 0::numeric)
            - coalesce((
              select sum(mer.merma)::numeric
              from public.eventos mer
              where mer.type = 'MERMA_RECORDED'
                and mer.produccion_evento_id = e.id
            ), 0::numeric)
          )
      end as prod_cantidad_efectiva,
      case
        when e.type = 'MERMA_RECORDED' then
          coalesce(e.merma, (e.payload ->> 'merma')::numeric, 0::numeric)
      end as merma_efectiva,
      case
        when e.type = 'DEFECT_RECORDED' then
          coalesce(e.cantidad, (e.payload ->> 'cantidad')::numeric, 0::numeric)
      end as defecto_cantidad_efectiva
    from public.eventos e
    where (p_ts_from is null or e."timestamp" >= p_ts_from)
      and (p_ts_to is null or e."timestamp" < p_ts_to)
      and (p_maquina_id is null or e.maquina_id = p_maquina_id)
      and (p_turno is null or e.turno = p_turno)
  ),
  scalars as (
    select
      coalesce(sum(prod_cantidad_efectiva), 0::numeric) as produccion_total,
      coalesce(sum(merma_efectiva), 0::numeric) as merma_total,
      (count(*) filter (where type = 'ORDER_COMPLETED'))::bigint as pedidos_completados,
      (count(*) filter (where type = 'ORDER_CREATED'))::bigint as pedidos_creados
    from base
  ),
  por_maquina as (
    select
      pm.maquina_id,
      pm.total_produccion,
      maq.codigo as maquina_codigo,
      maq.nombre as maquina_nombre,
      maq.linea_id,
      lp.nombre as linea_nombre
    from (
      select
        maquina_id,
        coalesce(sum(prod_cantidad_efectiva), 0::numeric) as total_produccion
      from base
      where prod_cantidad_efectiva is not null
      group by maquina_id
    ) pm
    left join public.maquinas maq on maq.id = pm.maquina_id
    left join public.linea_produccion lp on lp.id = maq.linea_id
    order by pm.total_produccion desc nulls last
  ),
  por_turno as (
    select
      turno,
      coalesce(sum(prod_cantidad_efectiva), 0::numeric) as total_produccion
    from base
    where prod_cantidad_efectiva is not null
      and turno is not null
    group by turno
    order by turno
  ),
  por_producto as (
    select
      b.producto_id,
      p.codigo as producto_codigo,
      p.descripcion as producto_descripcion,
      coalesce(sum(b.prod_cantidad_efectiva), 0::numeric) as total_produccion
    from base b
    left join public.producto p on p.id = b.producto_id
    where b.prod_cantidad_efectiva is not null
      and b.producto_id is not null
    group by b.producto_id, p.codigo, p.descripcion
    order by total_produccion desc
  ),
  produccion_por_dia as (
    select
      (date_trunc('day', b.evt_ts at time zone 'UTC'))::date as dia,
      coalesce(sum(b.prod_cantidad_efectiva), 0::numeric) as produccion
    from base b
    where b.prod_cantidad_efectiva is not null
      and b.prod_cantidad_efectiva > 0
    group by 1
    order by 1
  ),
  merma_por_maquina as (
    select
      b.maquina_id,
      coalesce(sum(b.merma_efectiva), 0::numeric) as merma_total,
      maq.codigo as maquina_codigo,
      maq.nombre as maquina_nombre
    from base b
    left join public.maquinas maq on maq.id = b.maquina_id
    where b.type = 'MERMA_RECORDED'
      and b.merma_efectiva is not null
    group by b.maquina_id, maq.codigo, maq.nombre
    having coalesce(sum(b.merma_efectiva), 0::numeric) > 0
    order by merma_total desc
    limit 25
  ),
  defectos as (
    select
      coalesce(
        nullif(trim(b.defecto), ''),
        nullif(trim(b.payload ->> 'tipo_defecto'), ''),
        '(sin_clasificar)'
      ) as defecto_grupo,
      max(dp.id) as defecto_catalogo_id,
      (bool_or(dp.id is not null)) as en_catalogo,
      count(*)::bigint as eventos,
      coalesce(sum(b.defecto_cantidad_efectiva), 0::numeric) as unidades
    from base b
    left join public.defectos_producto dp on dp.nombre = coalesce(nullif(trim(b.defecto), ''), nullif(trim(b.payload ->> 'tipo_defecto'), ''))
    where b.type = 'DEFECT_RECORDED'
    group by 1
    order by unidades desc, eventos desc
  ),
  fallas as (
    select
      coalesce(b.falla_maquina, '(sin_clasificar)') as falla_grupo,
      max(fm.id) as falla_catalogo_id,
      (bool_or(fm.id is not null)) as en_catalogo,
      count(*)::bigint as ocurrencias
    from base b
    left join public.fallas_maquina fm on fm.nombre = b.falla_maquina
    where b.type = 'MACHINE_FAILURE_RECORDED'
    group by coalesce(b.falla_maquina, '(sin_clasificar)')
    order by ocurrencias desc
  ),
  pedidos_por_estado as (
    select
      pe.estado,
      count(*)::bigint as cantidad
    from public.pedidos pe
    where (p_ts_from is null or pe.fecha_pedido >= p_ts_from)
      and (p_ts_to is null or pe.fecha_pedido < p_ts_to)
    group by pe.estado
    order by pe.estado
  ),
  pedidos_top_clientes as (
    select
      pe.cliente_id,
      c.nombre as cliente_nombre,
      count(*)::bigint as num_pedidos,
      coalesce(sum(pe.cantidad), 0)::bigint as unidades_pedidas
    from public.pedidos pe
    join public.clientes c on c.id = pe.cliente_id
    where (p_ts_from is null or pe.fecha_pedido >= p_ts_from)
      and (p_ts_to is null or pe.fecha_pedido < p_ts_to)
    group by pe.cliente_id, c.nombre
    order by num_pedidos desc, unidades_pedidas desc
    limit 15
  )
  select jsonb_build_object(
    'produccion_total', s.produccion_total,
    'merma_total', s.merma_total,
    'pct_merma',
      case
        when s.produccion_total > 0 then round((s.merma_total / s.produccion_total) * 100::numeric, 4)
        else null
      end,
    'por_maquina', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'maquina_id', m.maquina_id,
            'total_produccion', m.total_produccion,
            'maquina_codigo', m.maquina_codigo,
            'maquina_nombre', m.maquina_nombre,
            'linea_id', m.linea_id,
            'linea_nombre', m.linea_nombre
          ) order by m.total_produccion desc nulls last
        )
        from por_maquina m
      ),
      '[]'::jsonb
    ),
    'por_turno', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('turno', t.turno, 'total_produccion', t.total_produccion) order by t.turno
        )
        from por_turno t
      ),
      '[]'::jsonb
    ),
    'produccion_por_producto', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'producto_id', pp.producto_id,
            'producto_codigo', pp.producto_codigo,
            'producto_descripcion', pp.producto_descripcion,
            'total_produccion', pp.total_produccion
          ) order by pp.total_produccion desc
        )
        from por_producto pp
      ),
      '[]'::jsonb
    ),
    'produccion_por_dia', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'dia', pd.dia::text,
            'produccion', pd.produccion
          ) order by pd.dia
        )
        from produccion_por_dia pd
      ),
      '[]'::jsonb
    ),
    'merma_por_maquina', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'maquina_id', mm.maquina_id,
            'merma_total', mm.merma_total,
            'maquina_codigo', mm.maquina_codigo,
            'maquina_nombre', mm.maquina_nombre
          ) order by mm.merma_total desc
        )
        from merma_por_maquina mm
      ),
      '[]'::jsonb
    ),
    'defectos_top', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'defecto', d.defecto_grupo,
            'defecto_catalogo_id', d.defecto_catalogo_id,
            'en_catalogo', d.en_catalogo,
            'eventos', d.eventos,
            'unidades', d.unidades
          ) order by d.unidades desc, d.eventos desc
        )
        from defectos d
      ),
      '[]'::jsonb
    ),
    'fallas_maquina_top', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'falla_maquina', f.falla_grupo,
            'falla_catalogo_id', f.falla_catalogo_id,
            'en_catalogo', f.en_catalogo,
            'ocurrencias', f.ocurrencias
          ) order by f.ocurrencias desc
        )
        from fallas f
      ),
      '[]'::jsonb
    ),
    'pedidos_completados', s.pedidos_completados,
    'pedidos_creados', s.pedidos_creados,
    'cumplimiento_pedidos_pct',
      case
        when s.pedidos_creados > 0
        then round((s.pedidos_completados::numeric / s.pedidos_creados::numeric) * 100::numeric, 4)
        else null
      end,
    'pedidos_tabla_por_estado', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('estado', pe.estado, 'cantidad', pe.cantidad) order by pe.estado
        )
        from pedidos_por_estado pe
      ),
      '[]'::jsonb
    ),
    'pedidos_tabla_top_clientes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'cliente_id', tc.cliente_id,
            'cliente_nombre', tc.cliente_nombre,
            'num_pedidos', tc.num_pedidos,
            'unidades_pedidas', tc.unidades_pedidas
          ) order by tc.num_pedidos desc
        )
        from pedidos_top_clientes tc
      ),
      '[]'::jsonb
    ),
    'filtros', jsonb_build_object(
      'p_ts_from', p_ts_from,
      'p_ts_to', p_ts_to,
      'p_maquina_id', p_maquina_id,
      'p_turno', p_turno,
      'nota_produccion', 'produccion_total y series usan unidades netas (bruta del evento − mermas con produccion_evento_id)',
      'nota_maquina', 'p_maquina_id y p_turno solo aplican a métricas derivadas de eventos, no a pedidos_tabla_*'
    )
  )
  from scalars s;
$$;

comment on function public.fn_kpis_eventos(timestamptz, timestamptz, bigint, text) is
  'KPIs planta: producción neta (bruta − mermas enlazadas); mermas por evento MERMA_RECORDED; resto igual que v006.';

grant execute on function public.fn_kpis_eventos(timestamptz, timestamptz, bigint, text) to authenticated;
grant execute on function public.fn_kpis_eventos(timestamptz, timestamptz, bigint, text) to service_role;

commit;
