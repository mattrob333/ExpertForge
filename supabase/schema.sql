-- ExpertForge Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'team')),
  subscription_status text check (subscription_status in ('active', 'canceled', 'past_due')),
  stripe_customer_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Experts table (AI-generated personas)
create table public.experts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  essence text not null,
  avatar_url text,
  introduction text not null,
  role text,
  is_legend boolean default false,
  stats jsonb not null,
  core_beliefs text[] not null,
  aesthetics jsonb not null,
  expertise_map jsonb not null,
  thinking jsonb not null,
  personality jsonb not null,
  sidebar jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Teams table (advisory board configurations)
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('business', 'project', 'hypothetical', 'debate')),
  industry text,
  description text not null,
  needs text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Team structures table (org chart data)
create table public.team_structures (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null unique,
  nodes jsonb not null,
  edges jsonb not null,
  rationale text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.experts enable row level security;
alter table public.teams enable row level security;
alter table public.team_structures enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Experts policies
create policy "Users can view own experts" on public.experts
  for select using (auth.uid() = user_id);

create policy "Users can insert own experts" on public.experts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own experts" on public.experts
  for update using (auth.uid() = user_id);

create policy "Users can delete own experts" on public.experts
  for delete using (auth.uid() = user_id);

-- Teams policies
create policy "Users can view own teams" on public.teams
  for select using (auth.uid() = user_id);

create policy "Users can insert own teams" on public.teams
  for insert with check (auth.uid() = user_id);

create policy "Users can update own teams" on public.teams
  for update using (auth.uid() = user_id);

create policy "Users can delete own teams" on public.teams
  for delete using (auth.uid() = user_id);

-- Team structures policies
create policy "Users can view own team structures" on public.team_structures
  for select using (
    exists (
      select 1 from public.teams
      where teams.id = team_structures.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can insert own team structures" on public.team_structures
  for insert with check (
    exists (
      select 1 from public.teams
      where teams.id = team_structures.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can update own team structures" on public.team_structures
  for update using (
    exists (
      select 1 from public.teams
      where teams.id = team_structures.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can delete own team structures" on public.team_structures
  for delete using (
    exists (
      select 1 from public.teams
      where teams.id = team_structures.team_id
      and teams.user_id = auth.uid()
    )
  );

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_experts_updated_at
  before update on public.experts
  for each row execute procedure public.update_updated_at_column();

create trigger update_teams_updated_at
  before update on public.teams
  for each row execute procedure public.update_updated_at_column();

create trigger update_team_structures_updated_at
  before update on public.team_structures
  for each row execute procedure public.update_updated_at_column();

-- Indexes for performance
create index experts_user_id_idx on public.experts(user_id);
create index teams_user_id_idx on public.teams(user_id);
create index team_structures_team_id_idx on public.team_structures(team_id);
