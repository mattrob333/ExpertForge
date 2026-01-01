
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

export type AppState = 'landing' | 'auth' | 'home' | 'dashboard' | 'loading' | 'display' | 'training' | 'chat' | 'team-setup' | 'teams' | 'structure-preview';

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
