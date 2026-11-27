-- Verdict.AI database schema
-- ---------------------------------------------------------------------------
-- RECONSTRUCTED FROM THE CODE: compare with your real Supabase project before
-- running this on a fresh one. In particular, check your embedding size:
--     select vector_dims(embedding) from knowledge_graph limit 1;
-- and replace 3072 below if it differs.
-- Run in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

create extension if not exists vector;

-- Facts the agents can retrieve (filled by /api/knowledge/seed and by the
-- Logician's save_to_knowledge_graph tool).
create table if not exists knowledge_graph (
  id bigserial primary key,
  content text not null,
  embedding vector(3072) not null,
  created_at timestamptz not null default now()
);

-- One row per tribunal run; used by the sliding-window rate limiter.
create table if not exists api_logs (
  id bigserial primary key,
  created_at timestamptz not null default now()
);

-- Physics scenes for the visual simulation (filled by scripts/seed_simulations.mjs).
create table if not exists simulation_registry (
  id bigserial primary key,
  scenario_name text not null,
  description text not null,
  blueprint_json jsonb not null,
  embedding vector(3072) not null
);

-- Cosine-similarity search over the knowledge base.
create or replace function match_knowledge(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (id bigint, content text, similarity float)
language sql stable
as $$
  select k.id, k.content, 1 - (k.embedding <=> query_embedding) as similarity
  from knowledge_graph k
  where 1 - (k.embedding <=> query_embedding) > match_threshold
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_simulation(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (id bigint, scenario_name text, blueprint_json jsonb, similarity float)
language sql stable
as $$
  select s.id, s.scenario_name, s.blueprint_json, 1 - (s.embedding <=> query_embedding) as similarity
  from simulation_registry s
  where 1 - (s.embedding <=> query_embedding) > match_threshold
  order by s.embedding <=> query_embedding
  limit match_count;
$$;
