create extension if not exists vector;

create table if not exists customers (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists customer_profile (
  customer_id text primary key references customers(id),
  facts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists episodic_memory (
  id bigint generated always as identity primary key,
  customer_id text not null references customers(id),
  summary text not null,
  embedding vector(1024) not null,
  importance real not null default 0.5,
  created_at timestamptz not null default now(),
  last_recalled_at timestamptz
);
create index if not exists episodic_cust_idx on episodic_memory(customer_id);
create index if not exists episodic_vec_idx on episodic_memory using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists knowledge (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  embedding vector(1024) not null
);
create index if not exists knowledge_vec_idx on knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 50);

create table if not exists handoffs (
  id bigint generated always as identity primary key,
  customer_id text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  status text not null default 'open'
);
