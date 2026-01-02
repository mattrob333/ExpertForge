
export interface SkillTier {
  label: string;
  skills: string[];
}

export interface MentalModel {
  name: string;
  description: string;
}

export interface InteractionMode {
  title: string;
  description: string;
  accent: 'purple' | 'cyan' | 'green' | 'amber';
}

export interface Competency {
  label: string;
  level: number;
}

export interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'link';
  content: string;
}

export interface ExpertPersona {
  id: string;
  name: string;
  essence: string;
  avatarUrl?: string;
  introduction: string;
  role?: string; // e.g., 'Strategy', 'Product', etc.
  isLegend?: boolean;
  stats: {
    coreSkills: number;
    mentalModels: number;
    coreBeliefs: number;
    influences: number;
  };
  coreBeliefs: string[];
  aesthetics: {
    beautiful: string;
    cringe: string;
  };
  expertiseMap: {
    deepMastery: string[];
    workingKnowledge: string[];
    curiosityEdges: string[];
    honestLimits: string[];
  };
  thinking: {
    problemApproach: string;
    mentalModels: MentalModel[];
    reasoningPatterns: string;
  };
  personality: {
    energyProfile: string;
    interactionModes: {
      exploring: string;
      teaching: string;
      building: string;
      disagreeing: string;
    };
    signatureExpressions: string[];
    quirks: string[];
    selfAwareness: string;
  };
  sidebar: {
    competencies: Competency[];
    influences: string[];
     whatExcitesThem: string;
  };
}

export enum PersonalityDirection {
  PLAYFUL = 'Playful',
  INTENSE = 'Intense',
  CALM = 'Calm',
  PROVOCATIVE = 'Provocative',
  SUPPORTIVE = 'Supportive'
}

export interface TeamContext {
  type: 'business' | 'project' | 'hypothetical' | 'debate';
  name: string;
  industry?: string;
  description: string;
  needs: string[];
}

export interface TeamNode {
  id: string;
  role: string;
  description: string;
  position: { x: number; y: number };
}

export interface TeamEdge {
  id: string;
  source: string;
  target: string;
}

export interface TeamStructure {
  nodes: TeamNode[];
  edges: TeamEdge[];
  rationale: string[];
}

// Team source for organizational knowledge
export interface TeamSource {
  id: string;
  teamId: string;
  title: string;
  content: string;
  sourceType: 'text' | 'markdown' | 'file';
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Expert resource for agent knowledge and tools
export interface ExpertResource {
  id: string;
  expertId: string;
  title: string;
  description?: string;
  resourceType: 'url' | 'document' | 'api' | 'book' | 'tool' | 'capability';
  url?: string;
  content?: string;
  metadata?: Record<string, any>;
  isRecommended?: boolean;
  isAttached?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Structured resource request from AI
export interface ResourceRequest {
  category: 'capability' | 'book' | 'website' | 'document' | 'data';
  title: string;
  description: string;
  priority: 'required' | 'recommended' | 'nice-to-have';
  searchQuery?: string; // Query to use for auto-population
}

export interface ResourceRecommendations {
  introduction: string;
  resources: ResourceRequest[];
}

// Legend types for pre-built legendary business minds
export type LegendCategory = 
  | 'innovation'
  | 'operations'
  | 'growth'
  | 'strategy'
  | 'product'
  | 'leadership'
  | 'marketing'
  | 'engineering'
  | 'sales';

export interface LegendMentalModel {
  name: string;
  description: string;
  application?: string;       // How they apply this model
  quote?: string;
}

export interface LegendDecision {
  title: string;
  year?: number;
  situation: string;
  decision: string;
  logic: string;
  outcome: string;
}

export interface LegendSampleQuestion {
  question: string;
  previewResponse: string;
}

// Full Legend type aligned with Persona Creator Meta Prompt
// New fields are optional during migration - legends should be upgraded to include all fields
export interface Legend {
  id: string;
  name: string;
  title: string;              // "Customer Obsessed Operator"
  categories: LegendCategory[];
  rank: number;               // Within primary category
  photo?: string;
  
  // IDENTITY (new structure - optional during migration)
  identity?: {
    essence: string;          // One sentence: who they are and what they bring
    introduction: string;     // 2-3 sentences, first person, shows personality
    quote: string;            // Famous quote that captures their worldview
  };
  
  // WORLDVIEW - What does this expert BELIEVE? (optional during migration)
  worldview?: {
    coreBeliefs: string[];    // 3-5 strong, opinionated positions they'd argue for
    whatTheyFindBeautiful: string;  // What "good" looks like in their domain
    whatMakesThemCringe: string;    // Common mistakes that frustrate them
    influences: string[];     // Thinkers, practitioners, ideas that shaped them
  };
  
  // EXPERTISE - Depth + Range, not just skills (optional during migration)
  expertise?: {
    deepMastery: string[];    // Topics they could speak on for hours
    workingKnowledge: string[]; // Adjacent areas they're fluent in
    curiosityEdges: string[]; // What they're currently learning/interested in
    honestLimits: string[];   // Where their expertise ends
  };
  
  // THINKING STYLE - How they approach problems (optional during migration)
  thinkingStyle?: {
    howTheySeeProblems: string;  // Their characteristic approach
    mentalModels: LegendMentalModel[];  // 3-5 frameworks they apply
    reasoningPatterns: string;   // Systematic vs intuitive, how they handle uncertainty
  };
  
  // CONVERSATIONAL STYLE - How they show up (optional during migration)
  conversationalStyle?: {
    energy: string;           // Default conversational energy and tone
    whenExploringIdeas: string;    // How they brainstorm/discuss possibilities
    whenSharingOpinions: string;   // How they express views with confidence + humility
    whenTeaching: string;          // How they explain, what examples they use
    whenBuilding: string;          // How they approach collaborative creation
    whenDisagreeing: string;       // How they push back constructively
    signatureExpressions: string[]; // Natural verbal patterns (not catchphrases)
  };
  
  // PERSONALITY - Texture that makes them real (optional during migration)
  personality?: {
    quirks: string[];         // Small things they care about, pet peeves, delights
    selfAwareness: string;    // What they acknowledge about their own biases
    whatExcitesThem: string;  // What gets them genuinely animated
  };
  
  // FLEXIBILITY - How they adapt (optional during migration)
  flexibility?: {
    readingIntent: string;    // How they recognize different conversational modes
    bootUp: string;           // Their natural introduction style
    boundaries: string;       // How they handle requests outside expertise
  };
  
  // LEGACY FIELDS (for backward compatibility - will be removed after full migration)
  overview?: {
    corePhilosophy: string[];
    knownFor: string[];
    influences: string[];
  };
  mentalModels?: LegendMentalModel[];
  famousDecisions: LegendDecision[];
  sampleQuestions: LegendSampleQuestion[];
  mockResponses: string[];
  quote?: string;  // Deprecated - use identity.quote
}

// Update AppState to include legends
export type AppState = 
  | 'landing' 
  | 'auth' 
  | 'home' 
  | 'dashboard' 
  | 'loading' 
  | 'display' 
  | 'training' 
  | 'chat' 
  | 'team-setup' 
  | 'teams' 
  | 'structure-preview'
  | 'legends'
  | 'legend-profile'
  | 'node-agent-config'; // New: Configure agents for org chart nodes

// ============================================================================
// NEW TYPES: Org Node Agents & Company Context System
// ============================================================================

// Company context - detailed info that all agents can reference
export interface CompanyContext {
  id: string;
  teamId: string;
  
  // Basic Info
  companyName: string;
  industry: string;
  companyStage?: 'startup' | 'growth' | 'established' | 'enterprise';
  teamSize?: string;
  foundingYear?: number;
  headquarters?: string;
  
  // Strategic Info
  mission?: string;
  vision?: string;
  coreValues?: string[];
  
  // Business Details
  productsServices?: string[];
  targetMarket?: string;
  customerSegments?: string[];
  competitors?: string[];
  uniqueValueProposition?: string;
  revenueModel?: string;
  
  // Current State
  currentChallenges?: string[];
  shortTermGoals?: string[];
  longTermGoals?: string[];
  keyMetrics?: string[];
  
  // Freeform
  customContext?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Agent status for org nodes
export type AgentStatus = 'empty' | 'generating' | 'active' | 'error';

// Configuration for each node in the org chart
export interface OrgNodeAgent {
  id: string;
  teamId: string;
  nodeId: string; // References node ID in TeamStructure
  
  // Primary AI Agent
  primaryAgentId?: string; // References ExpertPersona.id
  primaryAgent?: ExpertPersona; // Populated when loaded
  
  // Backup/Advisor Legends
  backupLegendIds: string[]; // Array of legend IDs from legends.ts
  
  // Real Person Assignment
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  
  // Role Configuration
  roleTitle?: string;
  roleLevel?: number; // 1=C-level, 2=VP, 3=Director, 4=Manager, 5=IC
  roleContext?: string;
  roleResponsibilities?: string[];
  roleKpis?: string[];
  roleTools?: string[];
  
  // Status
  agentStatus: AgentStatus;
  generationError?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Knowledge document types
export type KnowledgeContentType = 'text' | 'markdown' | 'url' | 'file' | 'structured';
export type KnowledgeVisibility = 'private' | 'role' | 'team' | 'public';

export interface KnowledgeDocument {
  id: string;
  
  // Ownership (at least one)
  teamId?: string;
  nodeAgentId?: string;
  expertId?: string;
  
  // Document Info
  title: string;
  description?: string;
  contentType: KnowledgeContentType;
  content: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
  tags?: string[];
  visibility: KnowledgeVisibility;
  
  // Usage
  lastAccessedAt?: string;
  accessCount: number;
  
  createdAt: string;
  updatedAt: string;
}

// Team member roles for collaboration
export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  assignedNodeIds: string[];
  
  // Invitation tracking
  invitedBy?: string;
  invitedAt?: string;
  acceptedAt?: string;
  
  createdAt: string;
}

// Chat session with role agents
export type ChatAgentType = 'primary' | 'legend' | 'both' | 'team';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentId?: string; // Which agent responded
  agentName?: string;
  isLegend?: boolean;
}

export interface ChatSession {
  id: string;
  teamId: string;
  nodeAgentId?: string;
  userId: string;
  
  title?: string;
  messages: ChatMessage[];
  
  activeAgentType: ChatAgentType;
  activeLegendId?: string;
  
  isArchived: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// Extended ExpertPersona for role agents
export type ExpertAgentType = 'standalone' | 'role_agent' | 'cloned_legend';

export interface RoleAgentPersona extends ExpertPersona {
  teamId?: string;
  nodeId?: string;
  agentType: ExpertAgentType;
  companyContextSnapshot?: Partial<CompanyContext>;
}

// Full context object for agent prompts
export interface AgentContext {
  company: {
    name: string;
    industry: string;
    stage?: string;
    size?: string;
    mission?: string;
    vision?: string;
    products?: string[];
    targetMarket?: string;
    challenges?: string[];
    goals?: string[];
    customContext?: string;
  };
  role: {
    title: string;
    level?: number;
    context?: string;
    responsibilities?: string[];
    kpis?: string[];
  };
  team: {
    name: string;
    type: string;
    description: string;
  };
}

// Request to create a role-specific agent
export interface CreateRoleAgentRequest {
  teamId: string;
  nodeId: string;
  roleTitle: string;
  roleLevel: number;
  roleContext?: string;
  roleResponsibilities?: string[];
  backupLegendIds?: string[];
}
