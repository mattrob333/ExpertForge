/**
 * Discourse Service - Handles panel selection, stance assignment, and discourse orchestration
 * for the Emergent Chat / Intellectual Emergence System
 */

import { GoogleGenAI, Type } from "@google/genai";
import {
  ExpertPersona,
  Legend,
  QuestionAnalysis,
  DiscoursePanel,
  DiscourseStance,
  DiscourseMessage,
  DiscoursePhase,
  EmergenceEvaluation,
  EmergenceReport,
  DiscourseSession,
  CognitiveStyle,
  NaturalOrientation,
  DebateExchange,
  DebateSummary,
  SilentDirectorSession,
  DebateStage,
} from "../types";

// Stance prompts injected into expert system prompts during discourse
export const STANCE_PROMPTS: Record<DiscourseStance, string> = {
  advocate: `
## YOUR STANCE: ADVOCATE

For this discourse, you are arguing IN FAVOR of the proposition.
Your job is to make the strongest possible case. Find the best evidence,
the most compelling reasoning, the most persuasive framing.

This doesn't mean being dishonest—acknowledge weaknesses if they exist.
But your primary mission is to ensure the best possible case FOR is heard.

Steel-man the proposition. Find angles others haven't considered.
`,
  skeptic: `
## YOUR STANCE: SKEPTIC

For this discourse, you are arguing AGAINST the proposition.
Your job is to find the weaknesses, the risks, the unconsidered downsides.

This doesn't mean being nihilistic—acknowledge strengths if they exist.
But your primary mission is to ensure the best possible case AGAINST is heard.

Find the fatal flaw. Identify what could go wrong. Question assumptions.
`,
  neutral: `
## YOUR STANCE: NEUTRAL EVALUATOR

For this discourse, you are a neutral analyst. Your job is to evaluate
objectively, weighing evidence on all sides without advocacy.

Call it as you see it. Don't soften bad news. Don't amplify good news.
Help the discourse find truth, not a predetermined conclusion.
`,
  devils_advocate: `
## YOUR STANCE: DEVIL'S ADVOCATE

For this discourse, your job is to argue for the position NOBODY else is arguing.
If consensus forms, break it. If the minority view is dismissed, champion it.

You're not necessarily right—you're ensuring all perspectives get fair hearing.
The value you add is preventing groupthink, even if your position doesn't prevail.
`,
  synthesizer: `
## YOUR STANCE: SYNTHESIZER

For this discourse, your job is to find integration points. When others disagree,
ask: "What would be true if you're BOTH right?" Look for false dichotomies.

You're not wishy-washy—you have strong views. But your lens is integration.
Find the synthesis that incorporates the best of opposing viewpoints.
`,
};

// Conductor prompt for orchestrating discourse
export const CONDUCTOR_PROMPT = `
You are the Discourse Conductor for an intellectual emergence system. Your job is
to orchestrate expert debate to produce novel insights.

You are NOT a neutral facilitator. You actively hunt for:
- Intellectual arbitrage (combining frameworks reveals something new)
- Shared blind spots (what are all experts assuming?)
- False dichotomies (is this really either/or?)
- Synthesis opportunities (what if both sides are right?)

## YOUR PROCESS

1. GATHER INITIAL POSITIONS
   Ask each expert for their view. Require: position, reasoning, assumptions, confidence.

2. MAP COLLISIONS
   Identify where experts disagree. Rank by synthesis potential.

3. DIRECT CHALLENGES
   Pair experts for specific confrontations:
   "[Expert A], address [Expert B]'s claim that [X]. How do you reconcile?"
   
4. WATCH FOR SYNTHESIS
   When you see an integration opportunity, call it out:
   "Interesting—Expert A said [X] and Expert B said [Y]. What if both are true?"

5. INJECT RED TEAM
   If consensus forms too easily, challenge it:
   "You're all assuming [X]. What if that's wrong?"
   "Who would disagree with this, and why might they be right?"

6. ATTEMPT SYNTHESIS
   When ready, propose: "Here's what I'm seeing emerge from this discourse..."
   Let experts validate or challenge.

7. DETECT EMERGENCE
   Ask yourself:
   - Is this insight novel? Would it surprise a sophisticated observer?
   - Could any single expert have reached this alone?
   - Which specific collisions produced this?

8. FINALIZE
   Produce the emergence report with full attribution.

## CRITICAL RULES

- Never let experts talk past each other. Force direct engagement.
- If stuck after 2 exchanges, escalate (red team, new angle, or move on).
- Bias toward synthesis over endless debate.
- Your output isn't just an answer—it's the visible journey to that answer.
`;

// Question analysis schema
const QUESTION_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['strategic', 'tactical', 'operational', 'philosophical'] },
    domains: { type: Type.ARRAY, items: { type: Type.STRING } },
    tensions: { type: Type.ARRAY, items: { type: Type.STRING } },
    cognitiveNeeds: {
      type: Type.OBJECT,
      properties: {
        analytical: { type: Type.BOOLEAN },
        creative: { type: Type.BOOLEAN },
        practical: { type: Type.BOOLEAN },
      },
      required: ['analytical', 'creative', 'practical'],
    },
    hiddenAssumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['type', 'domains', 'tensions', 'cognitiveNeeds', 'hiddenAssumptions'],
};

/**
 * Analyze a question to determine domains, tensions, and cognitive needs
 */
export async function analyzeQuestion(question: string, context?: string): Promise<QuestionAnalysis> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const prompt = `
Analyze this question for structured intellectual discourse:

QUESTION: "${question}"
${context ? `CONTEXT: ${context}` : ''}

Determine:
1. TYPE: Is this strategic (big-picture direction), tactical (how to execute), operational (day-to-day), or philosophical (fundamental beliefs)?

2. DOMAINS: What expertise areas are relevant? (e.g., finance, product, marketing, operations, legal, technology, strategy, leadership, sales, hr)

3. TENSIONS: What are the inherent trade-offs or disagreements likely to emerge? (e.g., "Growth speed vs. market fit", "Short-term revenue vs. long-term brand")

4. COGNITIVE NEEDS: Does this question need:
   - analytical thinking (data, evidence, rigorous evaluation)?
   - creative thinking (novel framing, unexpected connections)?
   - practical thinking (implementation reality, operational constraints)?

5. HIDDEN ASSUMPTIONS: What is the questioner assuming that might not be true?

Be specific and insightful. This analysis will be used to select the optimal debate panel.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUESTION_ANALYSIS_SCHEMA,
    },
  });

  return JSON.parse(response.text || '{}') as QuestionAnalysis;
}

/**
 * Score an expert's relevance to a question
 */
function scoreExpertForQuestion(
  expert: ExpertPersona,
  analysis: QuestionAnalysis
): number {
  let score = 0;

  // Domain match (check expertise areas)
  const expertDomains = [
    expert.category || '',
    expert.role || '',
    ...(expert.expertiseMap?.deepMastery || []),
    ...(expert.expertiseMap?.workingKnowledge || []),
  ].map(d => d.toLowerCase());

  for (const domain of analysis.domains) {
    const domainLower = domain.toLowerCase();
    if (expertDomains.some(ed => ed.includes(domainLower) || domainLower.includes(ed))) {
      score += 25;
    }
  }

  // Cognitive style match
  if (analysis.cognitiveNeeds.analytical && expert.cognitive_style === 'analytical') score += 15;
  if (analysis.cognitiveNeeds.creative && expert.cognitive_style === 'creative') score += 15;
  if (analysis.cognitiveNeeds.practical && expert.cognitive_style === 'practical') score += 15;

  // Legends get slight boost for novel perspective
  if (expert.isLegend) score += 10;

  // Natural orientation diversity bonus
  if (expert.natural_orientation) score += 5;

  return score;
}

/**
 * Ensure cognitive diversity in the panel (Sternberg's Triarchic Theory)
 */
function ensureCognitiveDiversity(
  panel: ExpertPersona[],
  availableExperts: ExpertPersona[]
): ExpertPersona[] {
  const styles = panel.map(p => p.cognitive_style).filter(Boolean);
  
  const hasAnalytical = styles.includes('analytical');
  const hasCreative = styles.includes('creative');
  const hasPractical = styles.includes('practical');

  const result = [...panel];

  // Add missing cognitive styles from available experts
  if (!hasAnalytical) {
    const analytical = availableExperts.find(
      e => e.cognitive_style === 'analytical' && !panel.includes(e)
    );
    if (analytical) result.push(analytical);
  }

  if (!hasCreative) {
    const creative = availableExperts.find(
      e => e.cognitive_style === 'creative' && !panel.includes(e)
    );
    if (creative) result.push(creative);
  }

  if (!hasPractical) {
    const practical = availableExperts.find(
      e => e.cognitive_style === 'practical' && !panel.includes(e)
    );
    if (practical) result.push(practical);
  }

  return result;
}

/**
 * Assign stances to panel members
 */
function assignStances(
  panel: ExpertPersona[],
  analysis: QuestionAnalysis
): DiscoursePanel[] {
  const assignments: DiscoursePanel[] = [];
  let hasAdvocate = false;
  let hasSkeptic = false;

  for (const expert of panel) {
    let stance: DiscourseStance;

    // Use natural orientation as guide
    if (!hasAdvocate && expert.natural_orientation === 'advocate') {
      stance = 'advocate';
      hasAdvocate = true;
    } else if (!hasSkeptic && (expert.natural_orientation === 'skeptical' || expert.natural_orientation === 'contrarian')) {
      stance = 'skeptic';
      hasSkeptic = true;
    } else if (expert.natural_orientation === 'synthesizer') {
      stance = 'synthesizer';
    } else if (expert.natural_orientation === 'contrarian') {
      stance = 'devils_advocate';
    } else {
      // Fill gaps
      if (!hasAdvocate) {
        stance = 'advocate';
        hasAdvocate = true;
      } else if (!hasSkeptic) {
        stance = 'skeptic';
        hasSkeptic = true;
      } else {
        stance = 'neutral';
      }
    }

    assignments.push({
      agentId: expert.id,
      agent: expert,
      assignedStance: stance,
      rationale: `${expert.name} assigned as ${stance} based on ${expert.cognitive_style || 'general'} thinking style`,
    });
  }

  // Ensure we always have advocate and skeptic
  if (!hasAdvocate && assignments.length > 0) {
    assignments[0].assignedStance = 'advocate';
  }
  if (!hasSkeptic && assignments.length > 1) {
    assignments[1].assignedStance = 'skeptic';
  }

  return assignments;
}

/**
 * Convert Legend to ExpertPersona format for discourse
 */
export function legendToExpert(legend: Legend): ExpertPersona {
  return {
    id: legend.id || `legend-${legend.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: legend.name,
    essence: legend.title,
    avatarUrl: legend.photo,
    introduction: legend.identity?.introduction || legend.quote || '',
    role: legend.categories?.[0] || 'Advisor',
    category: (legend.categories?.[0]?.toLowerCase() as ExpertPersona['category']) || 'leadership',
    isLegend: true,
    cognitive_style: inferCognitiveStyle(legend),
    natural_orientation: inferNaturalOrientation(legend),
    stats: {
      coreSkills: legend.rank || 90,
      mentalModels: legend.mentalModels?.length || 5,
      coreBeliefs: legend.worldview?.coreBeliefs?.length || 4,
      influences: legend.worldview?.influences?.length || 3,
    },
    coreBeliefs: legend.worldview?.coreBeliefs || legend.overview?.corePhilosophy || [],
    aesthetics: {
      beautiful: legend.worldview?.whatTheyFindBeautiful || '',
      cringe: legend.worldview?.whatMakesThemCringe || '',
    },
    expertiseMap: {
      deepMastery: legend.expertise?.deepMastery || legend.overview?.knownFor || [],
      workingKnowledge: legend.expertise?.workingKnowledge || [],
      curiosityEdges: legend.expertise?.curiosityEdges || [],
      honestLimits: legend.expertise?.honestLimits || [],
    },
    thinking: {
      problemApproach: legend.thinkingStyle?.howTheySeeProblems || '',
      mentalModels: legend.mentalModels || [],
      reasoningPatterns: legend.thinkingStyle?.reasoningPatterns || '',
    },
    personality: {
      energyProfile: '',
      interactionModes: {
        exploring: '',
        teaching: '',
        building: '',
        disagreeing: '',
      },
      signatureExpressions: [],
      quirks: [],
      selfAwareness: '',
    },
    sidebar: {
      competencies: [],
      influences: legend.worldview?.influences || legend.overview?.influences || [],
      whatExcitesThem: '',
    },
  };
}

/**
 * Infer cognitive style from legend data
 */
function inferCognitiveStyle(legend: Legend): CognitiveStyle {
  const text = [
    legend.title || '',
    ...(legend.overview?.knownFor || []),
    ...(legend.worldview?.coreBeliefs || []),
  ].join(' ').toLowerCase();

  if (text.includes('data') || text.includes('analytical') || text.includes('evidence') || text.includes('rational') || text.includes('value')) {
    return 'analytical';
  }
  if (text.includes('creative') || text.includes('innovative') || text.includes('disrupt') || text.includes('vision') || text.includes('design')) {
    return 'creative';
  }
  return 'practical';
}

/**
 * Infer natural orientation from legend data
 */
function inferNaturalOrientation(legend: Legend): NaturalOrientation {
  const name = legend.name.toLowerCase();
  const text = [
    legend.title || '',
    ...(legend.worldview?.coreBeliefs || []),
  ].join(' ').toLowerCase();

  // Known figures with specific orientations
  if (name.includes('buffett') || name.includes('munger') || name.includes('kahneman')) {
    return 'skeptical';
  }
  if (name.includes('thiel') || name.includes('contrarian')) {
    return 'contrarian';
  }
  if (name.includes('dalio')) {
    return 'synthesizer';
  }
  if (name.includes('musk') || name.includes('jobs') || name.includes('bezos')) {
    return 'advocate';
  }

  // Infer from text
  if (text.includes('skeptic') || text.includes('risk') || text.includes('careful') || text.includes('cautious')) {
    return 'skeptical';
  }
  if (text.includes('contrarian') || text.includes('unconventional') || text.includes('against')) {
    return 'contrarian';
  }
  if (text.includes('synthesis') || text.includes('integrate') || text.includes('both')) {
    return 'synthesizer';
  }

  return 'advocate';
}

/**
 * Select optimal debate panel for a question
 */
export async function selectDebatePanel(
  question: string,
  teamAgents: ExpertPersona[],
  legendaryAdvisors: Legend[],
  context?: string,
  maxPanelSize: number = 5
): Promise<{
  panel: DiscoursePanel[];
  rationale: string;
  analysis: QuestionAnalysis;
}> {
  // Step 1: Analyze the question
  const analysis = await analyzeQuestion(question, context);

  // Step 2: Convert legends to expert format and combine candidates
  const legendExperts = legendaryAdvisors.map(legendToExpert);
  const candidates = [...teamAgents, ...legendExperts];

  // Step 3: Score each candidate
  const scored = candidates.map(expert => ({
    expert,
    score: scoreExpertForQuestion(expert, analysis),
  }));

  // Step 4: Sort by score and take top candidates
  scored.sort((a, b) => b.score - a.score);
  let selectedExperts = scored.slice(0, maxPanelSize).map(s => s.expert);

  // Step 5: Ensure cognitive diversity
  selectedExperts = ensureCognitiveDiversity(selectedExperts, candidates);

  // Step 6: Limit to max panel size
  selectedExperts = selectedExperts.slice(0, maxPanelSize);

  // Step 7: Assign stances
  const panel = assignStances(selectedExperts, analysis);

  // Step 8: Generate rationale
  const rationale = generatePanelRationale(panel, analysis);

  return { panel, rationale, analysis };
}

/**
 * Generate rationale for panel selection
 */
function generatePanelRationale(panel: DiscoursePanel[], analysis: QuestionAnalysis): string {
  const parts: string[] = [];

  parts.push(`Panel assembled for ${analysis.type} question covering ${analysis.domains.join(', ')}.`);

  const cognitiveStyles = panel.map(p => p.agent.cognitive_style).filter(Boolean);
  const uniqueStyles = [...new Set(cognitiveStyles)];
  parts.push(`Cognitive diversity: ${uniqueStyles.join(', ') || 'mixed'}.`);

  const stances = panel.map(p => p.assignedStance);
  parts.push(`Stance coverage: ${stances.join(', ')}.`);

  const legends = panel.filter(p => p.agent.isLegend);
  if (legends.length > 0) {
    parts.push(`Legendary perspectives: ${legends.map(l => l.agent.name).join(', ')}.`);
  }

  return parts.join(' ');
}

/**
 * Generate a position statement from an expert
 */
export async function generatePositionStatement(
  expert: ExpertPersona,
  stance: DiscourseStance,
  question: string,
  context?: string
): Promise<DiscourseMessage> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const prompt = `
You are ${expert.name}, ${expert.essence}.

Your core beliefs: ${expert.coreBeliefs?.join('. ') || 'Not specified'}
Your expertise: ${expert.expertiseMap?.deepMastery?.join(', ') || 'General business expertise'}

${STANCE_PROMPTS[stance]}

QUESTION FOR DISCOURSE: "${question}"
${context ? `CONTEXT: ${context}` : ''}

Provide your INITIAL POSITION on this question. Structure your response:

1. POSITION: Your clear stance (1-2 sentences)
2. REASONING: Why you hold this position (2-3 key points)
3. KEY ASSUMPTIONS: What you're assuming to be true
4. CONFIDENCE: Rate 1-10 with brief explanation

Stay in character. Be opinionated. Use your signature thinking patterns.
Speak in first person as ${expert.name}.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    phase: 'position',
    agentId: expert.id,
    agentName: expert.name,
    agentAvatar: expert.avatarUrl,
    stance,
    content: response.text || 'Unable to generate position.',
    timestamp: new Date(),
  };
}

/**
 * Generate a challenge/response during directed challenges phase
 */
export async function generateChallenge(
  challenger: ExpertPersona,
  challengerStance: DiscourseStance,
  target: ExpertPersona,
  targetPosition: string,
  question: string
): Promise<DiscourseMessage> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const prompt = `
You are ${challenger.name}, ${challenger.essence}.

${STANCE_PROMPTS[challengerStance]}

In a structured discourse about: "${question}"

${target.name} stated:
"${targetPosition}"

Your task: DIRECTLY CHALLENGE ${target.name}'s position.
- First, steel-man their argument (show you understand the strongest version)
- Then, identify the flaw, risk, or overlooked factor
- Be specific and constructive, not dismissive
- Stay in character as ${challenger.name}

Speak in first person. Be direct but respectful.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    phase: 'challenge',
    agentId: challenger.id,
    agentName: challenger.name,
    agentAvatar: challenger.avatarUrl,
    stance: challengerStance,
    content: response.text || 'Unable to generate challenge.',
    timestamp: new Date(),
    metadata: {
      targetAgent: target.name,
    },
  };
}

/**
 * Generate a red team intervention
 */
export async function generateRedTeamIntervention(
  discourseHistory: DiscourseMessage[],
  question: string
): Promise<DiscourseMessage> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const historyText = discourseHistory
    .map(m => `${m.agentName} (${m.stance}): ${m.content}`)
    .join('\n\n');

  const prompt = `
You are the Red Team Interventionist in a structured intellectual discourse.

QUESTION: "${question}"

DISCOURSE SO FAR:
${historyText}

Your job: BREAK CONSENSUS and CHALLENGE SHARED ASSUMPTIONS.

Look for:
1. What are ALL participants assuming that might not be true?
2. What perspective is nobody representing?
3. What historical counter-example contradicts the emerging consensus?
4. What second-order consequence is being ignored?

Provide a RED TEAM CHALLENGE that forces the discourse to reconsider.
Be provocative but intellectually rigorous. Start with "RED TEAM INTERVENTION:"
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    phase: 'red_team',
    agentName: 'Red Team',
    content: response.text || 'Unable to generate red team intervention.',
    isSystem: true,
    timestamp: new Date(),
  };
}

/**
 * Attempt synthesis of the discourse
 */
export async function attemptSynthesis(
  discourseHistory: DiscourseMessage[],
  panel: DiscoursePanel[],
  question: string
): Promise<DiscourseMessage> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const historyText = discourseHistory
    .map(m => `${m.agentName} (${m.stance || 'System'}): ${m.content}`)
    .join('\n\n');

  const prompt = `
You are the Synthesis Engine for an intellectual emergence system.

ORIGINAL QUESTION: "${question}"

PANEL MEMBERS:
${panel.map(p => `- ${p.agent.name} (${p.assignedStance}): ${p.agent.essence}`).join('\n')}

DISCOURSE HISTORY:
${historyText}

Your task: SYNTHESIZE the key insights from this discourse.

Structure your synthesis:

1. THE EMERGING INSIGHT: What novel understanding is forming from these collisions?

2. KEY COLLISIONS THAT PRODUCED IT: Which specific disagreements or challenges led to this insight?

3. WHAT EACH PERSPECTIVE CONTRIBUTED:
${panel.map(p => `   - ${p.agent.name}: [their contribution]`).join('\n')}

4. REMAINING TENSIONS: What hasn't been resolved?

5. THE SYNTHESIS: A clear, actionable conclusion that integrates the best thinking.

Focus on insights that NO SINGLE EXPERT would have reached alone—ideas that only emerged from the collision of frameworks.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    phase: 'synthesis',
    agentName: 'Synthesis Engine',
    content: response.text || 'Unable to generate synthesis.',
    isSystem: true,
    timestamp: new Date(),
  };
}

/**
 * Detect emergence and evaluate the synthesis
 */
export async function detectEmergence(
  synthesis: string,
  discourseHistory: DiscourseMessage[],
  panel: DiscoursePanel[],
  question: string
): Promise<EmergenceEvaluation> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const prompt = `
Evaluate whether this synthesis represents genuine intellectual emergence.

ORIGINAL QUESTION: "${question}"

SYNTHESIS: "${synthesis}"

PANEL: ${panel.map(p => `${p.agent.name} (${p.assignedStance})`).join(', ')}

Evaluate on these criteria:

1. NOVELTY (1-10): Is this non-obvious? Would it surprise a sophisticated observer?

2. SINGLE-EXPERT-DERIVABILITY: Could any ONE expert have reached this alone?
   Analyze each panel member—would they have arrived at this insight independently?

3. COLLISION-DEPENDENCY: Which specific disagreement or collision produced this?
   Identify the exact exchange or tension that catalyzed the insight.

4. SIGNIFICANCE (1-10): Does this matter? Is it actionable?

Provide your evaluation as JSON with these fields:
- noveltyScore (number 1-10)
- isGenuineEmergence (boolean)
- singleExpertDerivable (boolean)
- keyCollision (string describing the collision that produced the insight)
- attribution (object mapping expert names to their contribution)
- verdict ("genuine_emergence" | "obvious_combination" | "needs_development")
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || '{}') as EmergenceEvaluation;
  } catch {
    return {
      noveltyScore: 5,
      isGenuineEmergence: false,
      singleExpertDerivable: true,
      keyCollision: 'Unable to determine',
      attribution: {},
      verdict: 'needs_development',
    };
  }
}

/**
 * Generate the final emergence report
 */
export function generateEmergenceReport(
  discourseId: string,
  question: string,
  synthesis: DiscourseMessage,
  evaluation: EmergenceEvaluation,
  journey: DiscourseMessage[],
  panel: DiscoursePanel[]
): EmergenceReport {
  return {
    discourseId,
    question,
    synthesis: synthesis.content,
    evaluation,
    journey,
    panel,
    uncertainties: [], // Could be extracted from synthesis
    nextSteps: [], // Could be extracted from synthesis
    createdAt: new Date(),
  };
}

/**
 * Create a new discourse session
 */
export function createDiscourseSession(
  question: string,
  panel: DiscoursePanel[],
  analysis: QuestionAnalysis,
  teamId?: string
): DiscourseSession {
  return {
    id: `discourse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    teamId,
    question,
    questionAnalysis: analysis,
    panel,
    messages: [],
    currentPhase: 'position',
    status: 'panel_selection',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// =============================================================================
// SILENT DIRECTOR MODE
// =============================================================================

/**
 * The Silent Director Prompt - orchestrates natural debate without assigned stances
 */
/**
 * Structure raw user input into a proper debate format
 */
export async function structureDebateStage(rawInput: string, context?: string): Promise<DebateStage> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const prompt = `
You are a debate architect. Take this raw user input and structure it into a proper debate format.

## RAW USER INPUT
"${rawInput}"
${context ? `\nADDITIONAL CONTEXT: ${context}` : ''}

## YOUR TASK
Extract and clarify what the user actually wants to explore. Return JSON:

{
  "clarifiedQuestion": "A clear, specific question that captures what the user is really asking",
  "userIntent": "What the user is trying to decide, understand, or solve (1-2 sentences)",
  "desiredOutcome": "What a successful debate would produce for this user (1-2 sentences)",
  "debateFormat": "The type of discourse needed: 'strategic decision', 'exploration', 'problem-solving', 'devil's advocate', or 'brainstorm'",
  "keyConsiderations": ["factor 1", "factor 2", "factor 3"] // 3-5 key factors the debate should address
}

Be specific. Turn vague inputs into actionable debate topics.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  try {
    const parsed = JSON.parse(response.text || '{}');
    return {
      rawInput,
      clarifiedQuestion: parsed.clarifiedQuestion || rawInput,
      userIntent: parsed.userIntent || 'Explore this topic from multiple expert perspectives',
      desiredOutcome: parsed.desiredOutcome || 'Actionable insights and recommendations',
      debateFormat: parsed.debateFormat || 'exploration',
      keyConsiderations: parsed.keyConsiderations || [],
    };
  } catch {
    return {
      rawInput,
      clarifiedQuestion: rawInput,
      userIntent: 'Explore this topic',
      desiredOutcome: 'Gain clarity and actionable insights',
      debateFormat: 'exploration',
      keyConsiderations: [],
    };
  }
}

export const SILENT_DIRECTOR_PROMPT = `
You are the Silent Director. You animate ONE persona at a time.

## ANIMATION RULES

1. **Authentic voice** - The persona speaks from their genuine worldview, beliefs, and expertise
2. **Varied length** - Responses should feel natural: some brief and punchy (2-3 sentences), some elaborate (a full paragraph). Match the persona's style and what the moment calls for.
3. **Specific and actionable** - Name real examples, frameworks, companies, numbers when relevant
4. **Build on what came before** - Reference and engage with previous points directly
5. **Natural disagreement** - Challenge ideas to improve them, not to win

## OUTPUT FORMAT

Output ONLY the persona's response. No name prefix, no formatting, no narrator text.
Just their words, spoken in first person, in character.
`;

/**
 * Generate a SINGLE exchange from the next persona in the debate
 * This enables streaming one response at a time
 */
export async function generateSingleExchange(
  persona: ExpertPersona,
  debateStage: DebateStage,
  previousExchanges: DebateExchange[],
  allPersonas: ExpertPersona[]
): Promise<DebateExchange> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  // Build persona context
  const personaContext = `
**${persona.name}** - ${persona.essence}
Core Beliefs: ${persona.coreBeliefs?.slice(0, 3).join('; ') || 'Not specified'}
Expertise: ${persona.expertiseMap?.deepMastery?.slice(0, 4).join(', ') || 'General expertise'}
Mental Models: ${persona.thinking?.mentalModels?.slice(0, 3).map(m => m.name).join(', ') || 'Various frameworks'}
Thinking Style: ${persona.thinking?.problemApproach || 'Analytical and thorough'}
When Disagreeing: ${persona.personality?.interactionModes?.disagreeing || 'Direct but respectful'}
Style: ${persona.personality?.quirks?.slice(0, 2).join('; ') || 'Thoughtful and direct'}
`;

  // Build conversation history
  const historyText = previousExchanges.length > 0 
    ? previousExchanges.map(e => `**${e.speakerName}:** ${e.content}`).join('\n\n')
    : '';

  const otherPersonas = allPersonas.filter(p => p.id !== persona.id).map(p => p.name).join(', ');
  const isFirstSpeaker = previousExchanges.length === 0;
  const lastSpeaker = previousExchanges.length > 0 ? previousExchanges[previousExchanges.length - 1].speakerName : null;

  const prompt = `
${SILENT_DIRECTOR_PROMPT}

## YOU ARE NOW ANIMATING
${personaContext}

## THE DEBATE
**Topic:** ${debateStage.clarifiedQuestion}
**Goal:** ${debateStage.desiredOutcome}
**Key Considerations:** ${debateStage.keyConsiderations.join(', ')}

## OTHER PARTICIPANTS
${otherPersonas}

${isFirstSpeaker ? `
## YOUR TASK
You are opening this debate. Share your initial perspective on this topic.
Be specific - name real examples, cite frameworks, propose concrete ideas.
Vary your length naturally - this opening might be substantial (a paragraph) or punchy (a few sharp sentences).
` : `
## CONVERSATION SO FAR
${historyText}

## YOUR TASK
Respond to what ${lastSpeaker} just said. You can:
- Agree and build on their point with your own expertise
- Challenge their reasoning with a specific counter-example
- Ask a probing question that exposes a gap in their thinking
- Offer a completely different angle based on your worldview

Be specific. Engage with their actual words. Vary your response length naturally - sometimes a brief, punchy reply is more powerful.
`}

Remember: Output ONLY your response. No name prefix. Just speak in character.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const content = (response.text || '').trim();

  return {
    id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    speakerName: persona.name,
    speakerId: persona.id,
    speakerAvatar: persona.avatarUrl,
    content,
    timestamp: new Date(),
  };
}

/**
 * Determine the next speaker in the debate (simple round-robin with some variation)
 */
export function getNextSpeaker(
  personas: ExpertPersona[],
  previousExchanges: DebateExchange[]
): ExpertPersona {
  if (previousExchanges.length === 0) {
    return personas[0]; // First persona starts
  }
  
  const lastSpeakerId = previousExchanges[previousExchanges.length - 1].speakerId;
  const lastIndex = personas.findIndex(p => p.id === lastSpeakerId);
  
  // Simple round-robin for now
  const nextIndex = (lastIndex + 1) % personas.length;
  return personas[nextIndex];
}

/**
 * Generate a summary of the debate
 */
export async function generateDebateSummary(
  topic: string,
  exchanges: DebateExchange[],
  personas: ExpertPersona[]
): Promise<DebateSummary> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

  const exchangeText = exchanges.map(e => `**${e.speakerName}:** ${e.content}`).join('\n\n');

  const prompt = `
Analyze this debate and capture what emerged from it.

## TOPIC
"${topic}"

## PARTICIPANTS
${personas.map(p => `- **${p.name}**: ${p.essence}`).join('\n')}

## THE DEBATE
${exchangeText}

## YOUR TASK

Produce a comprehensive debate summary. Return as JSON with this exact structure:

{
  "keyInsights": ["insight 1", "insight 2", ...],
  "agreements": ["point of agreement 1", ...],
  "tensions": ["productive tension 1", ...],
  "recommendations": ["specific actionable recommendation 1", ...],
  "contributions": {
    "${personas[0]?.name || 'Expert 1'}": "their unique contribution",
    "${personas[1]?.name || 'Expert 2'}": "their unique contribution"
  },
  "bottomLine": "One paragraph synthesis: the best path forward given everything discussed"
}

Guidelines:
- keyInsights: Novel understandings that emerged from the collision of these minds
- agreements: Where they found common ground
- tensions: Valuable disagreements that remain (not failures - productive tensions)
- recommendations: Concrete, actionable steps with specifics (names, numbers, timeframes when possible)
- contributions: What each persona uniquely brought to the discussion
- bottomLine: The actionable takeaway the user should act on

Be concise but thorough.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    const parsed = JSON.parse(response.text || '{}');
    return {
      id: `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      content: response.text || '',
      keyInsights: parsed.keyInsights || [],
      agreements: parsed.agreements || [],
      tensions: parsed.tensions || [],
      recommendations: parsed.recommendations || [],
      contributions: parsed.contributions || {},
      bottomLine: parsed.bottomLine || '',
      participants: personas.map(p => p.name),
      exchangeCount: exchanges.length,
      createdAt: new Date(),
    };
  } catch {
    return {
      id: `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      content: response.text || 'Unable to generate summary',
      keyInsights: [],
      agreements: [],
      tensions: [],
      recommendations: [],
      contributions: {},
      bottomLine: 'Summary generation encountered an error.',
      participants: personas.map(p => p.name),
      exchangeCount: exchanges.length,
      createdAt: new Date(),
    };
  }
}

/**
 * Create a new Silent Director session
 */
export function createSilentDirectorSession(
  topic: string,
  personas: ExpertPersona[],
  context?: string
): SilentDirectorSession {
  return {
    id: `silent-director-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    topic,
    context,
    personas,
    exchanges: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Select panel for Silent Director mode (no stance assignment)
 * Returns personas sorted by relevance but without assigned stances
 */
export async function selectSilentDirectorPanel(
  question: string,
  teamAgents: ExpertPersona[],
  legendaryAdvisors: Legend[],
  context?: string,
  maxPanelSize: number = 3
): Promise<{
  personas: ExpertPersona[];
  rationale: string;
  analysis: QuestionAnalysis;
}> {
  // Step 1: Analyze the question
  const analysis = await analyzeQuestion(question, context);

  // Step 2: Convert legends to expert format and combine candidates
  const legendExperts = legendaryAdvisors.map(legendToExpert);
  const candidates = [...teamAgents, ...legendExperts];

  // Step 3: Score each candidate
  const scored = candidates.map(expert => ({
    expert,
    score: scoreExpertForQuestion(expert, analysis),
  }));

  // Step 4: Sort by score and take top candidates
  scored.sort((a, b) => b.score - a.score);
  let selectedExperts = scored.slice(0, maxPanelSize).map(s => s.expert);

  // Step 5: Ensure cognitive diversity (still valuable for natural friction)
  selectedExperts = ensureCognitiveDiversity(selectedExperts, candidates);

  // Step 6: Limit to max panel size
  selectedExperts = selectedExperts.slice(0, maxPanelSize);

  // Step 7: Generate rationale (without stance info)
  const rationale = generateSilentDirectorRationale(selectedExperts, analysis);

  return { personas: selectedExperts, rationale, analysis };
}

/**
 * Generate rationale for Silent Director panel selection
 */
function generateSilentDirectorRationale(personas: ExpertPersona[], analysis: QuestionAnalysis): string {
  const parts: string[] = [];

  parts.push(`Panel assembled for ${analysis.type} question covering ${analysis.domains.join(', ')}.`);

  const cognitiveStyles = personas.map(p => p.cognitive_style).filter(Boolean);
  const uniqueStyles = [...new Set(cognitiveStyles)];
  parts.push(`Cognitive diversity: ${uniqueStyles.join(', ') || 'mixed'}.`);

  const legends = personas.filter(p => p.isLegend);
  if (legends.length > 0) {
    parts.push(`Legendary perspectives: ${legends.map(l => l.name).join(', ')}.`);
  }

  parts.push(`These minds will engage naturally based on their authentic worldviews.`);

  return parts.join(' ');
}
