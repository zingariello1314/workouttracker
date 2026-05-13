-- Phase 2 — intentions persistées (miroir depuis FastAPI avec clé service_role).
-- user_id = identifiant applicatif (JWT `sub` Momentum), pas forcément auth.users Supabase.
-- Le client navigateur n’écrit pas ici : uniquement le backend (clé service_role) ou outils admin.

create table if not exists public.momentum_intentions_v1 (
  id uuid primary key default gen_random_uuid (),
  user_id text not null,
  client_mutation_id text not null,
  intent text not null,
  payload jsonb not null default '{}'::jsonb,
  response_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint momentum_intentions_v1_idem unique (user_id, client_mutation_id)
);

create index if not exists momentum_intentions_v1_user_created_idx
  on public.momentum_intentions_v1 (user_id, created_at desc);

comment on table public.momentum_intentions_v1 is 'Intentions Phase 2 ; insert idempotent (user_id, client_mutation_id) depuis API Momentum.';

alter table public.momentum_intentions_v1 enable row level security;

-- Aucune policy pour les rôles anon/authenticated : pas d’accès direct PostgREST avec la clé anon.
-- La clé service_role (backend uniquement) contourne RLS.
