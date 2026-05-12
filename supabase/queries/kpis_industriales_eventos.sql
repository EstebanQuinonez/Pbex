-- =============================================================================
-- KPIs industriales: public.eventos + catálogos (004) y producto/línea (002)
-- Requisitos: migraciones 003 (eventos) y 004 (maquinas, defectos_producto, …)
-- La función versionada para producción vive en: supabase/migrations/006_dashboard_rls_and_kpis.sql
-- (incluye filtro p_turno, produccion_por_dia, merma_por_maquina y política RLS gerente/admin).
--
-- Uso — RPC:
--   const { data } = await supabase.rpc('fn_kpis_eventos', {
--     p_ts_from: '2026-01-01T00:00:00Z',
--     p_ts_to:   '2026-02-01T00:00:00Z',
--     p_maquina_id: null
--   })
--
-- Filtros:
--   - p_ts_from / p_ts_to aplican a eventos."timestamp" y a pedidos.fecha_pedido
--   - p_maquina_id solo filtra filas de eventos (pedidos no tiene máquina)
--
-- RLS: SECURITY INVOKER; necesitas SELECT en eventos, maquinas, pedidos, etc.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Índices recomendados (eventos + joins frecuentes)
-- ---------------------------------------------------------------------------
create index if not exists eventos_kpi_type_ts_idx
  on public.eventos (type, "timestamp" desc);

create index if not exists eventos_kpi_maquina_ts_idx
  on public.eventos (maquina_id, "timestamp" desc)
  where maquina_id is not null;

create index if not exists eventos_kpi_producto_ts_idx
  on public.eventos (producto_id, "timestamp" desc)
  where producto_id is not null;

create index if not exists pedidos_kpi_fecha_estado_idx
  on public.pedidos (fecha_pedido desc, estado);

-- ---------------------------------------------------------------------------
-- Función agregada
-- ---------------------------------------------------------------------------
create or replace function public.fn_kpis_eventos(
  p_ts_from timestamptz default null,
  p_ts_to timestamptz default null,
  p_maquina_id bigint default null
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
      e."timestamp",
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
          coalesce(e.cantidad, (e.payload ->> 'produccion_total')::numeric, 0::numeric)
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
  defectos as (
    select
      coalesce(b.defecto, '(sin_clasificar)') as defecto_grupo,
      max(dp.id) as defecto_catalogo_id,
      (bool_or(dp.id is not null)) as en_catalogo,
      count(*)::bigint as eventos,
      coalesce(sum(b.defecto_cantidad_efectiva), 0::numeric) as unidades
    from base b
    left join public.defectos_producto dp on dp.nombre = b.defecto
    where b.type = 'DEFECT_RECORDED'
    group by coalesce(b.defecto, '(sin_clasificar)')
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
      'nota_maquina', 'p_maquina_id solo aplica a métricas derivadas de eventos, no a pedidos_tabla_*'
    )
  )
  from scalars s;
$$;

comment on function public.fn_kpis_eventos(timestamptz, timestamptz, bigint) is
  'KPIs desde eventos + joins a maquinas, linea_produccion, producto, defectos_producto, fallas_maquina y agregados de pedidos/clientes (mismo rango de fechas en pedidos.fecha_pedido).';

grant execute on function public.fn_kpis_eventos(timestamptz, timestamptz, bigint) to authenticated;
grant execute on function public.fn_kpis_eventos(timestamptz, timestamptz, bigint) to service_role;

-- =============================================================================
-- Plantillas SQL Editor (eventos + catálogo máquina / línea)
-- Rango: "timestamp" >= desde AND < hasta
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4b) Producción por máquina con nombre (tabla maquinas + línea)
-- -----------------------------------------------------------------------------
-- SELECT e.maquina_id,
--        maq.codigo AS maquina_codigo,
--        maq.nombre AS maquina_nombre,
--        lp.nombre  AS linea_nombre,
--        coalesce(sum(coalesce(e.cantidad, (e.payload->>'produccion_total')::numeric)), 0) AS total
-- FROM public.eventos e
-- LEFT JOIN public.maquinas maq ON maq.id = e.maquina_id
-- LEFT JOIN public.linea_produccion lp ON lp.id = maq.linea_id
-- WHERE e.type = 'PRODUCTION_RECORDED'
--   AND e."timestamp" >= $1 AND e."timestamp" < $2
--   AND ($3::bigint IS NULL OR e.maquina_id = $3)
-- GROUP BY e.maquina_id, maq.codigo, maq.nombre, lp.nombre
-- ORDER BY total DESC NULLS LAST;

-- -----------------------------------------------------------------------------
-- 6b) Defectos con validación en catálogo defectos_producto
-- -----------------------------------------------------------------------------
-- SELECT coalesce(e.defecto, '(sin_clasificar)') AS defecto,
--        (dp.id IS NOT NULL) AS en_catalogo,
--        dp.id AS defecto_catalogo_id,
--        count(*) AS eventos,
--        coalesce(sum(coalesce(e.cantidad, (e.payload->>'cantidad')::numeric)), 0) AS unidades
-- FROM public.eventos e
-- LEFT JOIN public.defectos_producto dp ON dp.nombre = e.defecto
-- WHERE e.type = 'DEFECT_RECORDED'
--   AND e."timestamp" >= $1 AND e."timestamp" < $2
--   AND ($3::bigint IS NULL OR e.maquina_id = $3)
-- GROUP BY 1, dp.id
-- ORDER BY unidades DESC, eventos DESC;

-- -----------------------------------------------------------------------------
-- 7b) Fallas con catálogo fallas_maquina
-- -----------------------------------------------------------------------------
-- SELECT coalesce(e.falla_maquina, '(sin_clasificar)') AS falla_maquina,
--        (fm.id IS NOT NULL) AS en_catalogo,
--        fm.id AS falla_catalogo_id,
--        count(*) AS ocurrencias
-- FROM public.eventos e
-- LEFT JOIN public.fallas_maquina fm ON fm.nombre = e.falla_maquina
-- WHERE e.type = 'MACHINE_FAILURE_RECORDED'
--   AND e."timestamp" >= $1 AND e."timestamp" < $2
--   AND ($3::bigint IS NULL OR e.maquina_id = $3)
-- GROUP BY 1, fm.id
-- ORDER BY ocurrencias DESC;

-- -----------------------------------------------------------------------------
-- Pedidos por estado (tabla pedidos, mismo rango de fechas en fecha_pedido)
-- -----------------------------------------------------------------------------
-- SELECT pe.estado, count(*)::bigint AS cantidad
-- FROM public.pedidos pe
-- WHERE pe.fecha_pedido >= $1 AND pe.fecha_pedido < $2
-- GROUP BY pe.estado
-- ORDER BY pe.estado;

-- -----------------------------------------------------------------------------
-- 1) Producción total (solo eventos)
-- -----------------------------------------------------------------------------
-- SELECT coalesce(sum(coalesce(cantidad, (payload->>'produccion_total')::numeric)), 0) AS produccion_total
-- FROM public.eventos
-- WHERE type = 'PRODUCTION_RECORDED'
--   AND "timestamp" >= $1 AND "timestamp" < $2
--   AND ($3::bigint IS NULL OR maquina_id = $3);

-- -----------------------------------------------------------------------------
-- 2) Total mermas
-- -----------------------------------------------------------------------------
-- SELECT coalesce(sum(coalesce(merma, (payload->>'merma')::numeric)), 0) AS merma_total
-- FROM public.eventos
-- WHERE type = 'MERMA_RECORDED'
--   AND "timestamp" >= $1 AND "timestamp" < $2
--   AND ($3::bigint IS NULL OR maquina_id = $3);

-- -----------------------------------------------------------------------------
-- 3) Porcentaje de merma
-- -----------------------------------------------------------------------------
-- WITH p AS (
--   SELECT coalesce(sum(coalesce(cantidad, (payload->>'produccion_total')::numeric)), 0) AS prod
--   FROM public.eventos
--   WHERE type = 'PRODUCTION_RECORDED' AND "timestamp" >= $1 AND "timestamp" < $2
--     AND ($3::bigint IS NULL OR maquina_id = $3)
-- ), m AS (
--   SELECT coalesce(sum(coalesce(merma, (payload->>'merma')::numeric)), 0) AS merm
--   FROM public.eventos
--   WHERE type = 'MERMA_RECORDED' AND "timestamp" >= $1 AND "timestamp" < $2
--     AND ($3::bigint IS NULL OR maquina_id = $3)
-- )
-- SELECT CASE WHEN p.prod > 0 THEN round((m.merm / p.prod) * 100, 4) END AS pct_merma
-- FROM p, m;

-- -----------------------------------------------------------------------------
-- 4) Producción por máquina (solo id)
-- -----------------------------------------------------------------------------
-- SELECT maquina_id,
--        coalesce(sum(coalesce(cantidad, (payload->>'produccion_total')::numeric)), 0) AS total
-- FROM public.eventos
-- WHERE type = 'PRODUCTION_RECORDED'
--   AND "timestamp" >= $1 AND "timestamp" < $2
--   AND ($3::bigint IS NULL OR maquina_id = $3)
-- GROUP BY maquina_id
-- ORDER BY total DESC NULLS LAST;

-- -----------------------------------------------------------------------------
-- 5) Producción por turno
-- -----------------------------------------------------------------------------
-- SELECT turno,
--        coalesce(sum(coalesce(cantidad, (payload->>'produccion_total')::numeric)), 0) AS total
-- FROM public.eventos
-- WHERE type = 'PRODUCTION_RECORDED'
--   AND turno IS NOT NULL
--   AND "timestamp" >= $1 AND "timestamp" < $2
--   AND ($3::bigint IS NULL OR maquina_id = $3)
-- GROUP BY turno
-- ORDER BY turno;

-- -----------------------------------------------------------------------------
-- 8) Pedidos completados (eventos)
-- -----------------------------------------------------------------------------
-- SELECT count(*)::bigint AS pedidos_completados
-- FROM public.eventos
-- WHERE type = 'ORDER_COMPLETED'
--   AND "timestamp" >= $1 AND "timestamp" < $2
--   AND ($3::bigint IS NULL OR maquina_id = $3);

-- -----------------------------------------------------------------------------
-- 9) Cumplimiento pedidos (eventos)
-- -----------------------------------------------------------------------------
-- WITH c AS (
--   SELECT count(*)::bigint AS n FROM public.eventos
--   WHERE type = 'ORDER_CREATED' AND "timestamp" >= $1 AND "timestamp" < $2
--     AND ($3::bigint IS NULL OR maquina_id = $3)
-- ), d AS (
--   SELECT count(*)::bigint AS n FROM public.eventos
--   WHERE type = 'ORDER_COMPLETED' AND "timestamp" >= $1 AND "timestamp" < $2
--     AND ($3::bigint IS NULL OR maquina_id = $3)
-- )
-- SELECT CASE WHEN c.n > 0 THEN round((d.n::numeric / c.n::numeric) * 100, 4) END AS cumplimiento_pct
-- FROM c, d;
