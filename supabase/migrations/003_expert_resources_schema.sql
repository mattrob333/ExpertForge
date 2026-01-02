-- Expert Resources Schema
-- Stores resources (URLs, documents, tools) that each expert/agent needs to do their job

-- Expert resources table
create table public.expert_resources (
  id uuid default uuid_generate_v4() primary key,
  expert_id uuid references public.experts(id) on delete cascade not null,
  title text not null,
  description text,
  resource_type text not null check (resource_type in ('url', 'document', 'api', 'book', 'tool', 'capability')),
  url text, -- For URLs, API endpoints, etc.
  content text, -- For document content
  metadata jsonb, -- Additional info (author, ISBN for books, etc.)
  is_recommended boolean default false, -- True if AI recommended this
  is_attached boolean default false, -- True if resource has been configured/connected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.expert_resources enable row level security;

-- RLS Policies for expert_resources
create policy "Users can view own expert resources" on public.expert_resources
  for select using (
    exists (
      select 1 from public.experts
      where experts.id = expert_resources.expert_id
      and experts.user_id = auth.uid()
    )
  );

create policy "Users can insert own expert resources" on public.expert_resources
  for insert with check (
    exists (
      select 1 from public.experts
      where experts.id = expert_resources.expert_id
      and experts.user_id = auth.uid()
    )
  );

create policy "Users can update own expert resources" on public.expert_resources
  for update using (
    exists (
      select 1 from public.experts
      where experts.id = expert_resources.expert_id
      and experts.user_id = auth.uid()
    )
  );

create policy "Users can delete own expert resources" on public.expert_resources
  for delete using (
    exists (
      select 1 from public.experts
      where experts.id = expert_resources.expert_id
      and experts.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
create trigger update_expert_resources_updated_at
  before update on public.expert_resources
  for each row execute procedure public.update_updated_at_column();

-- Index for performance
create index expert_resources_expert_id_idx on public.expert_resources(expert_id);
