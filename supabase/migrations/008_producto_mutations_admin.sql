-- Mutaciones de catálogo de productos solo para rol ADMIN (JWT user_metadata.app_role).
-- La lectura sigue permitida a cualquier usuario autenticado (políticas *_select_auth existentes).
-- Requisito: mismo criterio que eventos_select_gerente_o_admin (claim app_role en JWT).

begin;

-- ---------------------------------------------------------------------------
-- public.producto
-- ---------------------------------------------------------------------------
drop policy if exists "producto_insert_auth" on public.producto;
drop policy if exists "producto_update_auth" on public.producto;
drop policy if exists "producto_delete_auth" on public.producto;

create policy "producto_insert_admin"
  on public.producto for insert to authenticated
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

create policy "producto_update_admin"
  on public.producto for update to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

create policy "producto_delete_admin"
  on public.producto for delete to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

-- ---------------------------------------------------------------------------
-- Especificaciones (se escriben desde la misma pantalla de productos)
-- ---------------------------------------------------------------------------
drop policy if exists "inyeccion_insert_auth" on public.espec_inyeccion;
drop policy if exists "inyeccion_update_auth" on public.espec_inyeccion;
drop policy if exists "inyeccion_delete_auth" on public.espec_inyeccion;

create policy "inyeccion_insert_admin"
  on public.espec_inyeccion for insert to authenticated
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

create policy "inyeccion_update_admin"
  on public.espec_inyeccion for update to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

create policy "inyeccion_delete_admin"
  on public.espec_inyeccion for delete to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

drop policy if exists "soplado_insert_auth" on public.espec_soplado;
drop policy if exists "soplado_update_auth" on public.espec_soplado;
drop policy if exists "soplado_delete_auth" on public.espec_soplado;

create policy "soplado_insert_admin"
  on public.espec_soplado for insert to authenticated
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

create policy "soplado_update_admin"
  on public.espec_soplado for update to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

create policy "soplado_delete_admin"
  on public.espec_soplado for delete to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

-- ---------------------------------------------------------------------------
-- Líneas y materiales (solo se crean desde el flujo de alta de producto, admin)
-- ---------------------------------------------------------------------------
drop policy if exists "linea_insert_auth" on public.linea_produccion;

create policy "linea_insert_admin"
  on public.linea_produccion for insert to authenticated
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

drop policy if exists "material_insert_auth" on public.material;

create policy "material_insert_admin"
  on public.material for insert to authenticated
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '') = 'ADMIN');

commit;
