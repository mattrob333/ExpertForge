-- ExpertForge Schema Migration: Org Agents & Knowledge Base System
-- Migration 001: Add support for custom role agents, company context, and knowledge bases
-- Run this AFTER the initial schema.sql

-- ============================================================================
-- PART 1: COMPANY CONTEXTS
-- Stores detailed company information that all agents can reference
-- ============================================================================

create table public.company_contexts (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null unique,
  
  -- Basic Company Info
  company_name text not null,
  industry text not null,
  company_stage text check (company_stage in ('startup', 'growth', 'established', 'enterprise')),
  team_size text, -- e.g., "5-10", "50-100", "500+"
  founding_year integer,
  headquarters text,
  
  -- Strategic Info
  mission text,
  vision text,
  core_values text[],
  
  -- Business Details
  products_services text[],
  target_market text,
  customer_segments text[],
  competitors text[],
  unique_value_proposition text,
  revenue_model text,
  
  -- Current State
  current_challenges text[],
  short_term_goals text[], -- Next 6-12 months
  long_term_goals text[], -- 2-5 years
  key_metrics text[],
  
  -- Freeform Context
  custom_context text, -- Any additional context the user wants agents to know
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- PART 2: ORG NODE AGENTS
-- Configuration for each node in the org chart
-- Links nodes to primary agents, backup legends, and real people
-- ============================================================================

create table public.org_node_agents (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  node_id text not null, -- References the node ID in team_structures.nodes JSONB
  
  -- Primary AI Agent (custom-generated for this specific role)
  primary_agent_id uuid references public.experts(id) on delete set null,
  
  -- Backup/Advisor Agents (legend IDs from legends.ts data file)
  -- These provide additional perspectives to the primary agent
  backup_legend_ids text[] default '{}', -- Array of legend IDs like ['musk', 'bezos', 'buffett']
  
  -- Real Person Assignment (who owns/manages this role)
  assigned_user_id uuid references public.profiles(id) on delete set null,
  assigned_user_name text, -- For display if not a registered user
  assigned_user_email text, -- For inviting non-registered users
  
  -- Role-Specific Configuration
  role_title text, -- Cached from node data for quick access
  role_level integer, -- 1=C-level, 2=VP, 3=Director, 4=Manager, 5=IC
  role_context text, -- Additional context specific to this role
  role_responsibilities text[],
  role_kpis text[], -- Key Performance Indicators for this role
  role_tools text[], -- Tools/systems this role uses
  
  -- Agent Generation Status
  agent_status text default 'empty' check (agent_status in ('empty', 'generating', 'active', 'error')),
  generation_error text, -- Store error message if generation failed
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(team_id, node_id) -- One config per node per team
);

-- ============================================================================
-- PART 3: KNOWLEDGE DOCUMENTS
-- Knowledge base documents that can be attached to teams, nodes, or agents
-- ============================================================================

create table public.knowledge_documents (
  id uuid default uuid_generate_v4() primary key,
  
  -- Ownership (at least one must be set)
  team_id uuid references public.teams(id) on delete cascade,
  node_agent_id uuid references public.org_node_agents(id) on delete cascade,
  expert_id uuid references public.experts(id) on delete cascade,
  
  -- Document Info
  title text not null,
  description text,
  content_type text not null check (content_type in ('text', 'markdown', 'url', 'file', 'structured')),
  content text not null,
  
  -- Metadata
  metadata jsonb default '{}'::jsonb, -- For structured data, file info, source URLs, etc.
  tags text[] default '{}',
  
  -- Access Control
  visibility text default 'team' check (visibility in ('private', 'role', 'team', 'public')),
  
  -- Usage Tracking
  last_accessed_at timestamp with time zone,
  access_count integer default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- At least one reference must be set
  check (team_id is not null or node_agent_id is not null or expert_id is not null)
);

-- ============================================================================
-- PART 4: TEAM MEMBERS
-- For multi-user team collaboration (invite others to your team)
-- ============================================================================

create table public.team_members (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Role within the team
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  
  -- Which org nodes this user is assigned to manage
  assigned_node_ids text[] default '{}',
  
  -- Invitation tracking
  invited_by uuid references public.profiles(id),
  invited_at timestamp with time zone,
  accepted_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(team_id, user_id)
);

-- ============================================================================
-- PART 5: CHAT SESSIONS
-- Chat history with specific roles/agents
-- ============================================================================

create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  node_agent_id uuid references public.org_node_agents(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Session Info
  title text,
  
  -- Messages stored as JSONB array
  -- Each message: { role: 'user'|'assistant'|'system', content: string, timestamp: string, agent_id?: string }
  messages jsonb not null default '[]'::jsonb,
  
  -- Which agent(s) are active in this chat
  active_agent_type text default 'primary' check (active_agent_type in ('primary', 'legend', 'both', 'team')),
  active_legend_id text, -- If chatting with a specific legend advisor
  
  -- Session state
  is_archived boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- PART 6: ALTER EXPERTS TABLE
-- Add columns to link experts to specific team nodes
-- ============================================================================

-- Add team linkage
alter table public.experts add column if not exists team_id uuid references public.teams(id) on delete cascade;

-- Add node linkage (which org chart node this expert was created for)
alter table public.experts add column if not exists node_id text;

-- Add agent type classification
alter table public.experts add column if not exists agent_type text default 'standalone' 
  check (agent_type in ('standalone', 'role_agent', 'cloned_legend'));

-- Add company context reference for role agents
alter table public.experts add column if not exists company_context_snapshot jsonb;

-- ============================================================================
-- PART 7: ENABLE ROW LEVEL SECURITY
-- ============================================================================

alter table public.company_contexts enable row level security;
alter table public.org_node_agents enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.team_members enable row level security;
alter table public.chat_sessions enable row level security;

-- ============================================================================
-- PART 8: RLS POLICIES - Company Contexts
-- ============================================================================

create policy "Users can view own team company contexts" on public.company_contexts
  for select using (
    exists (
      select 1 from public.teams
      where teams.id = company_contexts.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Team members can view company contexts" on public.company_contexts
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = company_contexts.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Users can insert own team company contexts" on public.company_contexts
  for insert with check (
    exists (
      select 1 from public.teams
      where teams.id = company_contexts.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can update own team company contexts" on public.company_contexts
  for update using (
    exists (
      select 1 from public.teams
      where teams.id = company_contexts.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can delete own team company contexts" on public.company_contexts
  for delete using (
    exists (
      select 1 from public.teams
      where teams.id = company_contexts.team_id
      and teams.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 9: RLS POLICIES - Org Node Agents
-- ============================================================================

create policy "Users can view own team node agents" on public.org_node_agents
  for select using (
    exists (
      select 1 from public.teams
      where teams.id = org_node_agents.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Team members can view node agents" on public.org_node_agents
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = org_node_agents.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Users can insert own team node agents" on public.org_node_agents
  for insert with check (
    exists (
      select 1 from public.teams
      where teams.id = org_node_agents.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can update own team node agents" on public.org_node_agents
  for update using (
    exists (
      select 1 from public.teams
      where teams.id = org_node_agents.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Assigned users can update their node agents" on public.org_node_agents
  for update using (
    assigned_user_id = auth.uid()
  );

create policy "Users can delete own team node agents" on public.org_node_agents
  for delete using (
    exists (
      select 1 from public.teams
      where teams.id = org_node_agents.team_id
      and teams.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 10: RLS POLICIES - Knowledge Documents
-- ============================================================================

create policy "Users can view team knowledge documents" on public.knowledge_documents
  for select using (
    -- Owner of the team
    exists (
      select 1 from public.teams
      where teams.id = knowledge_documents.team_id
      and teams.user_id = auth.uid()
    )
    or
    -- Team member
    exists (
      select 1 from public.team_members
      where team_members.team_id = knowledge_documents.team_id
      and team_members.user_id = auth.uid()
    )
    or
    -- Owner of the expert
    exists (
      select 1 from public.experts
      where experts.id = knowledge_documents.expert_id
      and experts.user_id = auth.uid()
    )
  );

create policy "Users can insert knowledge documents" on public.knowledge_documents
  for insert with check (
    exists (
      select 1 from public.teams
      where teams.id = knowledge_documents.team_id
      and teams.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.experts
      where experts.id = knowledge_documents.expert_id
      and experts.user_id = auth.uid()
    )
  );

create policy "Users can update own knowledge documents" on public.knowledge_documents
  for update using (
    exists (
      select 1 from public.teams
      where teams.id = knowledge_documents.team_id
      and teams.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.experts
      where experts.id = knowledge_documents.expert_id
      and experts.user_id = auth.uid()
    )
  );

create policy "Users can delete own knowledge documents" on public.knowledge_documents
  for delete using (
    exists (
      select 1 from public.teams
      where teams.id = knowledge_documents.team_id
      and teams.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.experts
      where experts.id = knowledge_documents.expert_id
      and experts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 11: RLS POLICIES - Team Members
-- ============================================================================

create policy "Team owners can view team members" on public.team_members
  for select using (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Users can view their own team memberships" on public.team_members
  for select using (user_id = auth.uid());

create policy "Team owners can insert team members" on public.team_members
  for insert with check (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Team owners can update team members" on public.team_members
  for update using (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
      and teams.user_id = auth.uid()
    )
  );

create policy "Team owners can delete team members" on public.team_members
  for delete using (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
      and teams.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 12: RLS POLICIES - Chat Sessions
-- ============================================================================

create policy "Users can view own chat sessions" on public.chat_sessions
  for select using (user_id = auth.uid());

create policy "Users can insert own chat sessions" on public.chat_sessions
  for insert with check (user_id = auth.uid());

create policy "Users can update own chat sessions" on public.chat_sessions
  for update using (user_id = auth.uid());

create policy "Users can delete own chat sessions" on public.chat_sessions
  for delete using (user_id = auth.uid());

-- ============================================================================
-- PART 13: TRIGGERS - Updated At
-- ============================================================================

create trigger update_company_contexts_updated_at
  before update on public.company_contexts
  for each row execute procedure public.update_updated_at_column();

create trigger update_org_node_agents_updated_at
  before update on public.org_node_agents
  for each row execute procedure public.update_updated_at_column();

create trigger update_knowledge_documents_updated_at
  before update on public.knowledge_documents
  for each row execute procedure public.update_updated_at_column();

create trigger update_chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.update_updated_at_column();

-- ============================================================================
-- PART 14: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Company contexts
create index company_contexts_team_id_idx on public.company_contexts(team_id);

-- Org node agents
create index org_node_agents_team_id_idx on public.org_node_agents(team_id);
create index org_node_agents_node_id_idx on public.org_node_agents(node_id);
create index org_node_agents_primary_agent_idx on public.org_node_agents(primary_agent_id);
create index org_node_agents_assigned_user_idx on public.org_node_agents(assigned_user_id);

-- Knowledge documents
create index knowledge_documents_team_id_idx on public.knowledge_documents(team_id);
create index knowledge_documents_node_agent_id_idx on public.knowledge_documents(node_agent_id);
create index knowledge_documents_expert_id_idx on public.knowledge_documents(expert_id);

-- Team members
create index team_members_team_id_idx on public.team_members(team_id);
create index team_members_user_id_idx on public.team_members(user_id);

-- Chat sessions
create index chat_sessions_team_id_idx on public.chat_sessions(team_id);
create index chat_sessions_node_agent_id_idx on public.chat_sessions(node_agent_id);
create index chat_sessions_user_id_idx on public.chat_sessions(user_id);

-- Experts (new indexes for team/node linkage)
create index if not exists experts_team_id_idx on public.experts(team_id);
create index if not exists experts_node_id_idx on public.experts(node_id);
create index if not exists experts_agent_type_idx on public.experts(agent_type);

-- ============================================================================
-- PART 15: HELPER FUNCTIONS
-- ============================================================================

-- Function to get full context for an agent (company + role context)
create or replace function public.get_agent_context(p_node_agent_id uuid)
returns jsonb as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'company', jsonb_build_object(
      'name', cc.company_name,
      'industry', cc.industry,
      'stage', cc.company_stage,
      'size', cc.team_size,
      'mission', cc.mission,
      'vision', cc.vision,
      'products', cc.products_services,
      'target_market', cc.target_market,
      'challenges', cc.current_challenges,
      'goals', cc.short_term_goals,
      'custom_context', cc.custom_context
    ),
    'role', jsonb_build_object(
      'title', ona.role_title,
      'level', ona.role_level,
      'context', ona.role_context,
      'responsibilities', ona.role_responsibilities,
      'kpis', ona.role_kpis
    ),
    'team', jsonb_build_object(
      'name', t.name,
      'type', t.type,
      'description', t.description
    )
  ) into v_result
  from public.org_node_agents ona
  join public.teams t on t.id = ona.team_id
  left join public.company_contexts cc on cc.team_id = ona.team_id
  where ona.id = p_node_agent_id;
  
  return v_result;
end;
$$ language plpgsql security definer;

-- Function to count agents on a team
create or replace function public.get_team_agent_stats(p_team_id uuid)
returns jsonb as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'total_nodes', count(*),
    'active_agents', count(*) filter (where agent_status = 'active'),
    'empty_nodes', count(*) filter (where agent_status = 'empty'),
    'assigned_users', count(distinct assigned_user_id) filter (where assigned_user_id is not null)
  ) into v_result
  from public.org_node_agents
  where team_id = p_team_id;
  
  return v_result;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
