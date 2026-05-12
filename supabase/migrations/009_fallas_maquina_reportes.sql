-- Reportes de falla de máquina: momento de la falla, resolución (ADMIN), FK catálogo fallas_maquina.
-- Requiere 003–005 (eventos.falla_maquina, fallas_maquina.nombre único).

begin;

-- ---------------------------------------------------------------------------
-- 1) Columnas operativas (todas las filas: falla_resuelta default false)
-- ---------------------------------------------------------------------------
alter table public.eventos add column if not exists falla_ocurrida_at timestamptz;

alter table public.eventos add column if not exists falla_resuelta boolean;

update public.eventos
set falla_resuelta = false
where falla_resuelta is null;

alter table public.eventos
  alter column falla_resuelta set default false;

alter table public.eventos
  alter column falla_resuelta set not null;

comment on column public.eventos.falla_ocurrida_at is
  'DEFECT_RECORDED (falla de máquina): fecha/hora en que ocurrió la falla. distinto de "timestamp" (alta del evento).';

comment on column public.eventos.falla_resuelta is
  'DEFECT_RECORDED con falla de máquina: el ADMIN marca si ya se resolvió.';

-- ---------------------------------------------------------------------------
-- 2) FK falla_maquina → fallas_maquina(nombre) (sustituye CHECK estático de 003)
-- ---------------------------------------------------------------------------
update public.eventos e
set falla_maquina = null
where e.falla_maquina is not null
  and not exists (select 1 from public.fallas_maquina fm where fm.nombre = e.falla_maquina);

alter table public.eventos drop constraint if exists eventos_falla_maquina_check;

do $$
begin
  alter table public.eventos
    add constraint eventos_falla_maquina_fkey
    foreign key (falla_maquina) references public.fallas_maquina (nombre)
    on update cascade
    on delete restrict;
exception
  when duplicate_object then null;
end $$;

create index if not exists eventos_defect_falla_ts_idx
  on public.eventos (falla_ocurrida_at desc nulls last)
  where type = 'DEFECT_RECORDED' and falla_maquina is not null;

create index if not exists eventos_defect_falla_resuelta_idx
  on public.eventos (type, falla_resuelta)
  where type = 'DEFECT_RECORDED' and falla_maquina is not null;

-- ---------------------------------------------------------------------------
-- 3) RLS: ADMIN puede actualizar eventos DEFECT_RECORDED (marcar resolución)
-- ---------------------------------------------------------------------------
drop policy if exists "eventos_update_admin_defect_resolucion" on public.eventos;

create policy "eventos_update_admin_defect_resolucion"
  on public.eventos
  for update
  to authenticated
  using (
    type = 'DEFECT_RECORDED'
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN'
  )
  with check (
    type = 'DEFECT_RECORDED'
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN'
  );

commit;
