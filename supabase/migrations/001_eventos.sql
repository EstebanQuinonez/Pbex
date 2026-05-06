-- Tabla de eventos (enfoque basado en eventos)
-- Ejecuta este SQL en el editor SQL de Supabase (Dashboard → SQL) o con la CLI.

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('PRODUCTION_RECORDED', 'DEFECT_RECORDED')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists eventos_user_created_idx
  on public.eventos (user_id, created_at desc);

create index if not exists eventos_tipo_idx
  on public.eventos (tipo);

alter table public.eventos enable row level security;

create policy "eventos_select_own"
  on public.eventos for select
  using (auth.uid() = user_id);

create policy "eventos_insert_own"
  on public.eventos for insert
  with check (auth.uid() = user_id);
