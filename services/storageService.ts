import { supabase } from '../lib/supabase';
import { ExpertPersona, TeamContext, TeamStructure, TeamSource, ExpertResource } from '../types';

const STORAGE_KEYS = {
  experts: 'expertforge_experts',
  teamContext: 'expertforge_team_context',
  teamStructure: 'expertforge_team_structure',
};

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && url !== '' && key !== '';
};

// Type-safe Supabase helper to bypass strict typing when tables aren't in schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Convert ExpertPersona to database format
const personaToDbFormat = (persona: ExpertPersona, userId: string) => ({
  user_id: userId,
  name: persona.name,
  essence: persona.essence,
  avatar_url: persona.avatarUrl || null,
  introduction: persona.introduction,
  role: persona.role || null,
  is_legend: persona.isLegend || false,
  stats: persona.stats,
  core_beliefs: persona.coreBeliefs,
  aesthetics: persona.aesthetics,
  expertise_map: persona.expertiseMap,
  thinking: persona.thinking,
  personality: persona.personality,
  sidebar: persona.sidebar,
  team_id: persona.teamId || null,
  category: persona.category || null,
});

// Convert database format to ExpertPersona
const dbToPersonaFormat = (row: any): ExpertPersona => ({
  id: row.id,
  name: row.name,
  essence: row.essence,
  avatarUrl: row.avatar_url,
  introduction: row.introduction,
  role: row.role,
  isLegend: row.is_legend,
  stats: row.stats,
  coreBeliefs: row.core_beliefs,
  aesthetics: row.aesthetics,
  expertiseMap: row.expertise_map,
  thinking: row.thinking,
  personality: row.personality,
  sidebar: row.sidebar,
  teamId: row.team_id,
  category: row.category,
});

// EXPERTS

export async function getExperts(userId?: string): Promise<ExpertPersona[]> {
  if (isSupabaseConfigured() && userId) {
    const { data, error } = await db
      .from('experts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching experts:', error);
      return [];
    }

    return (data || []).map(dbToPersonaFormat);
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.experts);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveExpert(persona: ExpertPersona, userId?: string): Promise<ExpertPersona> {
  if (isSupabaseConfigured() && userId) {
    const { data, error } = await db
      .from('experts')
      .insert(personaToDbFormat(persona, userId))
      .select()
      .single();

    if (error) {
      console.error('Error saving expert:', error);
      throw error;
    }

    return dbToPersonaFormat(data);
  }

  // Fallback to localStorage
  const experts = await getExperts();
  const updatedExperts = [...experts, persona];
  localStorage.setItem(STORAGE_KEYS.experts, JSON.stringify(updatedExperts));
  return persona;
}

export async function deleteExpert(expertId: string, userId?: string): Promise<void> {
  if (isSupabaseConfigured() && userId) {
    const { error } = await db
      .from('experts')
      .delete()
      .eq('id', expertId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting expert:', error);
      throw error;
    }
    return;
  }

  // Fallback to localStorage
  const experts = await getExperts();
  const updatedExperts = experts.filter(e => e.id !== expertId);
  localStorage.setItem(STORAGE_KEYS.experts, JSON.stringify(updatedExperts));
}

// Extended TeamContext with ID for database operations
export interface TeamContextWithId extends TeamContext {
  id: string;
}

// TEAM CONTEXT

// Get all teams for a user
export async function getAllTeams(userId?: string): Promise<TeamContextWithId[]> {
  if (isSupabaseConfigured() && userId) {
    const { data, error } = await db
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      type: row.type as TeamContext['type'],
      name: row.name,
      industry: row.industry || undefined,
      description: row.description,
      needs: row.needs,
    }));
  }

  // Fallback to localStorage - return single team as array
  const stored = localStorage.getItem(STORAGE_KEYS.teamContext);
  if (stored) {
    try {
      const context = JSON.parse(stored);
      return [{ ...context, id: 'local-team-id' }];
    } catch {
      return [];
    }
  }
  return [];
}

export async function getTeamContext(userId?: string): Promise<TeamContext | null> {
  if (isSupabaseConfigured() && userId) {
    const { data, error } = await db
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching team context:', error);
      return null;
    }

    if (!data) return null;

    return {
      type: data.type as TeamContext['type'],
      name: data.name,
      industry: data.industry || undefined,
      description: data.description,
      needs: data.needs,
    };
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.teamContext);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveTeamContext(context: TeamContext, userId?: string): Promise<string> {
  if (isSupabaseConfigured() && userId) {
    const { data, error } = await db
      .from('teams')
      .insert({
        user_id: userId,
        name: context.name,
        type: context.type,
        industry: context.industry || null,
        description: context.description,
        needs: context.needs,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving team context:', error);
      throw error;
    }

    return data.id;
  }

  // Fallback to localStorage
  localStorage.setItem(STORAGE_KEYS.teamContext, JSON.stringify(context));
  return 'local-team-id';
}

export async function deleteTeam(teamId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    // Delete team (cascades to team_structures and team_sources due to foreign key constraints)
    const { error } = await db
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
    return;
  }

  // Fallback to localStorage - just clear the team context
  localStorage.removeItem(STORAGE_KEYS.teamContext);
}

// TEAM STRUCTURE

export async function getTeamStructure(teamId?: string, userId?: string): Promise<TeamStructure | null> {
  if (isSupabaseConfigured() && teamId) {
    const { data, error } = await db
      .from('team_structures')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching team structure:', error);
      return null;
    }

    if (!data) return null;

    return {
      nodes: data.nodes as TeamStructure['nodes'],
      edges: data.edges as TeamStructure['edges'],
      rationale: data.rationale,
    };
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.teamStructure);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveTeamStructure(
  structure: TeamStructure,
  teamId?: string
): Promise<void> {
  if (isSupabaseConfigured() && teamId) {
    const { error } = await db
      .from('team_structures')
      .upsert({
        team_id: teamId,
        nodes: structure.nodes,
        edges: structure.edges,
        rationale: structure.rationale,
      });

    if (error) {
      console.error('Error saving team structure:', error);
      throw error;
    }
    return;
  }

  // Fallback to localStorage
  localStorage.setItem(STORAGE_KEYS.teamStructure, JSON.stringify(structure));
}

// Clear all local storage (for logout)
export function clearLocalStorage() {
  localStorage.removeItem(STORAGE_KEYS.experts);
  localStorage.removeItem(STORAGE_KEYS.teamContext);
  localStorage.removeItem(STORAGE_KEYS.teamStructure);
}

// TEAM SOURCES

// Convert database format to TeamSource
const dbToSourceFormat = (row: any): TeamSource => ({
  id: row.id,
  teamId: row.team_id,
  title: row.title,
  content: row.content,
  sourceType: row.source_type,
  fileName: row.file_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function getTeamSources(teamId: string): Promise<TeamSource[]> {
  if (isSupabaseConfigured() && teamId) {
    const { data, error } = await db
      .from('team_sources')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team sources:', error);
      return [];
    }

    return (data || []).map(dbToSourceFormat);
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(`team_sources_${teamId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveTeamSource(
  teamId: string,
  source: Omit<TeamSource, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>
): Promise<TeamSource> {
  if (isSupabaseConfigured() && teamId) {
    const { data, error } = await db
      .from('team_sources')
      .insert({
        team_id: teamId,
        title: source.title,
        content: source.content,
        source_type: source.sourceType,
        file_name: source.fileName || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving team source:', error);
      throw error;
    }

    return dbToSourceFormat(data);
  }

  // Fallback to localStorage
  const sources = await getTeamSources(teamId);
  const newSource: TeamSource = {
    ...source,
    id: Math.random().toString(36).substr(2, 9),
    teamId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updatedSources = [...sources, newSource];
  localStorage.setItem(`team_sources_${teamId}`, JSON.stringify(updatedSources));
  return newSource;
}

export async function deleteTeamSource(sourceId: string, teamId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await db
      .from('team_sources')
      .delete()
      .eq('id', sourceId);

    if (error) {
      console.error('Error deleting team source:', error);
      throw error;
    }
    return;
  }

  // Fallback to localStorage
  const sources = await getTeamSources(teamId);
  const updatedSources = sources.filter(s => s.id !== sourceId);
  localStorage.setItem(`team_sources_${teamId}`, JSON.stringify(updatedSources));
}

// EXPERT RESOURCES

// Convert database format to ExpertResource
const dbToResourceFormat = (row: any): ExpertResource => ({
  id: row.id,
  expertId: row.expert_id,
  title: row.title,
  description: row.description,
  resourceType: row.resource_type,
  url: row.url,
  content: row.content,
  metadata: row.metadata,
  isRecommended: row.is_recommended,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function getExpertResources(expertId: string): Promise<ExpertResource[]> {
  if (isSupabaseConfigured() && expertId) {
    const { data, error } = await db
      .from('expert_resources')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expert resources:', error);
      return [];
    }

    return (data || []).map(dbToResourceFormat);
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(`expert_resources_${expertId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveExpertResource(
  expertId: string,
  resource: Omit<ExpertResource, 'id' | 'expertId' | 'createdAt' | 'updatedAt'>
): Promise<ExpertResource> {
  if (isSupabaseConfigured() && expertId) {
    const { data, error } = await db
      .from('expert_resources')
      .insert({
        expert_id: expertId,
        title: resource.title,
        description: resource.description || null,
        resource_type: resource.resourceType,
        url: resource.url || null,
        content: resource.content || null,
        metadata: resource.metadata || null,
        is_recommended: resource.isRecommended || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving expert resource:', error);
      throw error;
    }

    return dbToResourceFormat(data);
  }

  // Fallback to localStorage
  const resources = await getExpertResources(expertId);
  const newResource: ExpertResource = {
    ...resource,
    id: Math.random().toString(36).substr(2, 9),
    expertId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updatedResources = [...resources, newResource];
  localStorage.setItem(`expert_resources_${expertId}`, JSON.stringify(updatedResources));
  return newResource;
}

export async function deleteExpertResource(resourceId: string, expertId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await db
      .from('expert_resources')
      .delete()
      .eq('id', resourceId);

    if (error) {
      console.error('Error deleting expert resource:', error);
      throw error;
    }
    return;
  }

  // Fallback to localStorage
  const resources = await getExpertResources(expertId);
  const updatedResources = resources.filter(r => r.id !== resourceId);
  localStorage.setItem(`expert_resources_${expertId}`, JSON.stringify(updatedResources));
}

// ROLE ASSIGNMENTS

export interface RoleAssignment {
  nodeId: string;
  expertId?: string | null;
  legendId?: string | null;
  humanName?: string | null;
  humanEmail?: string | null;
  humanTitle?: string | null;
  customAgentId?: string | null;
}

export async function getRoleAssignments(teamId: string): Promise<RoleAssignment[]> {
  // For now, use localStorage since we don't have a Supabase table yet
  const stored = localStorage.getItem(`role_assignments_${teamId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveRoleAssignments(teamId: string, assignments: RoleAssignment[]): Promise<void> {
  localStorage.setItem(`role_assignments_${teamId}`, JSON.stringify(assignments));
}
