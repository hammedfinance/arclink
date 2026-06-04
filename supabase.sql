create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  full_name text,
  username text,
  dynamic_user_id text,
  dynamic_wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  circle_wallet_id text not null,
  wallet_address text,
  blockchain text default 'ARC-TESTNET',
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  amount numeric not null check (amount > 0),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.users(id) on delete cascade,
  recipient_user_id uuid not null references public.users(id) on delete cascade,
  sender_email text not null,
  recipient_email text not null,
  amount numeric not null check (amount > 0),
  message text,
  status text not null default 'pending',
  transaction_id text,
  circle_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_sender_user_id_created_at_idx
  on public.transactions (sender_user_id, created_at desc);

create index if not exists transactions_recipient_user_id_created_at_idx
  on public.transactions (recipient_user_id, created_at desc);
