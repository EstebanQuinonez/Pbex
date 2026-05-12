-- Enlaza eventos a catálogos 004 (operarios, encargados_linea, maquinas, pedidos, clientes, vendedores).
-- Requiere 004 aplicado. Convierte operario_id / encargado_id / vendedor_id de uuid (auth) a bigint (catálogo).
-- Si tenías datos uuid en esas columnas, se pierden al sustituir columnas.

begin;

alter table public.eventos drop constraint if exists eventos_operario_id_fkey;
alter table public.eventos drop constraint if exists eventos_encargado_id_fkey;
alter table public.eventos drop constraint if exists eventos_vendedor_id_fkey;

alter table public.eventos drop column if exists operario_id;
alter table public.eventos drop column if exists encargado_id;
alter table public.eventos drop column if exists vendedor_id;

alter table public.eventos add column operario_id bigint references public.operarios (id) on delete set null;
alter table public.eventos add column encargado_id bigint references public.encargados_linea (id) on delete set null;
alter table public.eventos add column vendedor_id bigint references public.vendedores (id) on delete set null;

do $$
begin
  alter table public.eventos add constraint eventos_maquina_id_fkey
    foreign key (maquina_id) references public.maquinas (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.eventos add constraint eventos_pedido_id_fkey
    foreign key (pedido_id) references public.pedidos (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.eventos add constraint eventos_cliente_id_fkey
    foreign key (cliente_id) references public.clientes (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create index if not exists eventos_operario_idx on public.eventos (operario_id) where operario_id is not null;
create index if not exists eventos_pedido_idx on public.eventos (pedido_id) where pedido_id is not null;

commit;
