-- Team Sources Schema
-- Stores organizational knowledge and context documents for teams

-- Team sources table (organizational knowledge)
create table public.team_sources (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  title text not null,
  content text not null,
  source_type text not null check (source_type in ('text', 'markdown', 'file')),
  file_name text, -- Original filename if uploaded
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.team_sources enable row level security;

-- RLS Policies for team_sources
create policy "Users can view own team sources" on public.team_sources
  for select using (
    exists (
      select 1 from public.teams
      where teams.id = team_sources.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can insert own team sources" on public.team_sources
  for insert with check (
    exists (
      select 1 from public.teams
      where teams.id = team_sources.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can update own team sources" on public.team_sources
  for update using (
    exists (
      select 1 from public.teams
      where teams.id = team_sources.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can delete own team sources" on public.team_sources
  for delete using (
    exists (
      select 1 from public.teams
      where teams.id = team_sources.team_id
      and teams.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
create trigger update_team_sources_updated_at
  before update on public.team_sources
  for each row execute procedure public.update_updated_at_column();

-- Index for performance
create index team_sources_team_id_idx on public.team_sources(team_id);
