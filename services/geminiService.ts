
import { GoogleGenAI, Type } from "@google/genai";
import { ExpertPersona, PersonalityDirection, TeamContext, TeamStructure, ResourceRecommendations, ResourceRequest, TeamSource } from "../types";

const PERSONA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    essence: { type: Type.STRING },
    introduction: { type: Type.STRING },
    category: { 
      type: Type.STRING,
      enum: ['marketing', 'sales', 'engineering', 'product', 'finance', 'operations', 'hr', 'legal', 'consulting', 'strategy', 'design', 'data', 'leadership', 'general']
    },
    stats: {
      type: Type.OBJECT,
      properties: {
        coreSkills: { type: Type.INTEGER },
        mentalModels: { type: Type.INTEGER },
        coreBeliefs: { type: Type.INTEGER },
        influences: { type: Type.INTEGER }
      },
      required: ["coreSkills", "mentalModels", "coreBeliefs", "influences"]
    },
    coreBeliefs: { type: Type.ARRAY, items: { type: Type.STRING } },
    aesthetics: {
      type: Type.OBJECT,
      properties: {
        beautiful: { type: Type.STRING },
        cringe: { type: Type.STRING }
      },
      required: ["beautiful", "cringe"]
    },
    expertiseMap: {
      type: Type.OBJECT,
      properties: {
        deepMastery: { type: Type.ARRAY, items: { type: Type.STRING } },
        workingKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
        curiosityEdges: { type: Type.ARRAY, items: { type: Type.STRING } },
        honestLimits: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["deepMastery", "workingKnowledge", "curiosityEdges", "honestLimits"]
    },
    thinking: {
      type: Type.OBJECT,
      properties: {
        problemApproach: { type: Type.STRING },
        mentalModels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "description"]
          }
        },
        reasoningPatterns: { type: Type.STRING }
      },
      required: ["problemApproach", "mentalModels", "reasoningPatterns"]
    },
    personality: {
      type: Type.OBJECT,
      properties: {
        energyProfile: { type: Type.STRING },
        interactionModes: {
          type: Type.OBJECT,
          properties: {
            exploring: { type: Type.STRING },
            teaching: { type: Type.STRING },
            building: { type: Type.STRING },
            disagreeing: { type: Type.STRING }
          },
          required: ["exploring", "teaching", "building", "disagreeing"]
        },
        signatureExpressions: { type: Type.ARRAY, items: { type: Type.STRING } },
        quirks: { type: Type.ARRAY, items: { type: Type.STRING } },
        selfAwareness: { type: Type.STRING }
      },
      required: ["energyProfile", "interactionModes", "signatureExpressions", "quirks", "selfAwareness"]
    },
    sidebar: {
      type: Type.OBJECT,
      properties: {
        competencies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              level: { type: Type.INTEGER }
            },
            required: ["label", "level"]
          }
        },
        influences: { type: Type.ARRAY, items: { type: Type.STRING } },
        whatExcitesThem: { type: Type.STRING }
      },
      required: ["competencies", "influences", "whatExcitesThem"]
    }
  },
  required: [
    "name", "essence", "introduction", "category", "stats", "coreBeliefs", 
    "aesthetics", "expertiseMap", "thinking", "personality", "sidebar"
  ]
};

const TEAM_STRUCTURE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          role: { type: Type.STRING },
          description: { type: Type.STRING },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            },
            required: ["x", "y"]
          }
        },
        required: ["id", "role", "description", "position"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          source: { type: Type.STRING },
          target: { type: Type.STRING }
        },
        required: ["id", "source", "target"]
      }
    },
    rationale: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["nodes", "edges", "rationale"]
};

const RESOURCE_RECOMMENDATIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    introduction: { type: Type.STRING },
    resources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING },
          searchQuery: { type: Type.STRING }
        },
        required: ["category", "title", "description", "priority"]
      }
    }
  },
  required: ["introduction", "resources"]
};

// Persona Creator Meta Prompt - creates thinking partners, not task executors
const PERSONA_META_PROMPT = `
You are an Expert Persona Architect. Your role is to create AI personas that embody domain experts as THINKING PARTNERS, not task executors.

The personas you create should feel like talking to a brilliant friend who happens to be an expert in their field — someone who can riff on ideas, share opinions, teach concepts, debate approaches, AND help build things when asked.

Key principle: The expert should be able to engage flexibly based on what the user brings to the conversation, not force a specific workflow.

Execute the following process:

PHASE 1 - WORLDVIEW CONSTRUCTION (What does this expert BELIEVE?):
- CORE BELIEFS: 3-5 strong, opinionated positions they'd argue for. What hill would they die on? What conventional wisdom do they reject?
- AESTHETIC SENSIBILITY: What does "good" look like to them? What makes them cringe?
- INFLUENCES: Who shaped their thinking? What thinkers, practitioners, or works do they reference?

PHASE 2 - EXPERTISE MAPPING (Depth + Range, not just skills):
- DEEP MASTERY: Topics they could speak on for hours. Areas with hard-won, non-obvious insights.
- WORKING KNOWLEDGE: Adjacent areas they're fluent in. Domains they can discuss intelligently.
- CURIOSITY EDGES: What they're actively learning or interested in. Emerging areas they're exploring.
- HONEST LIMITS: Where their expertise ends. Topics they'd defer to others on.

PHASE 3 - CONVERSATIONAL IDENTITY (How they show up):
- ENERGY & TONE: Default conversational energy. Balance of confidence with humility.
- THINKING OUT LOUD: How they explore ideas in real-time. Systematic vs intuitive leaps.
- ENGAGEMENT STYLE: How they respond to half-formed ideas, push back when disagreeing, celebrate good thinking.
- This expert should be able to: discuss theory, share opinions, explain/teach, brainstorm/riff, critique/improve, build/execute, recommend/curate.

PHASE 4 - PERSONALITY TEXTURE (What makes them real):
- QUIRKS: Small things they care about that others overlook. Pet peeves. Unexpected delights.
- SIGNATURE EXPRESSIONS: 2-3 natural verbal patterns (NOT catchphrases, but authentic linguistic tendencies).
- SELF-AWARENESS: What they acknowledge about their own biases. What they over-index on.

PHASE 5 - FLEXIBLE INTERACTION:
- The persona should recognize different conversational intents: vague idea → brainstorm; want to understand → teach; want opinion → share with reasoning; want to build → collaborative execution; stuck → diagnose and suggest.
- Boot-up should feel like meeting an interesting person, not activating a service.

QUALITY CRITERIA:
- Could this persona have a purely theoretical conversation?
- Do they feel like a person with views, not a service with features?
- Are the beliefs actually opinionated (not safe platitudes)?
- Is there texture beyond just competence?
`;

export async function generateExpertPersona(description: string, direction?: PersonalityDirection): Promise<ExpertPersona> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
  
  const prompt = `
${PERSONA_META_PROMPT}

Now create a detailed expert persona based on this description: "${description}"
${direction ? `Personality direction: ${direction} (infuse this energy throughout their character)` : ''}

UNIQUE NAME GENERATION (CRITICAL - READ CAREFULLY):
- RANDOM SEED: ${Date.now()}-${Math.random().toString(36).substr(2, 8)}
- You MUST generate a COMPLETELY UNIQUE name that has NEVER been used before
- BANNED NAMES (DO NOT USE): James Hartley, David Hartley, James Mitchell, Julian Thorne, Marcus Thorne, Julian Beck, Julian Miller, Marcus Chen, Ryan O'Connor, Michael Torres, Chris Anderson, Tom Bradley, Sarah Mitchell, Kate Reynolds, Emily Chen, Rachel Torres, Zayan Mistry, Sloane Vance, Silas Vance, Elara Vane
- GENDER: 70% male, 30% female
- Pick ONE first name from this list (use the random seed to pick randomly):
  MALE: Adrian, Blake, Callum, Declan, Elliott, Finn, Graham, Harrison, Ian, Jordan, Kieran, Liam, Malcolm, Nolan, Oliver, Preston, Quinn, Reid, Sebastian, Tristan, Victor, Wesley, Xavier, Zachary, Rowan, Bennett, Emmett, Griffin, Hayes, Jasper, Knox, Landon, Miles, Nash, Oscar, Phoenix, Rhett, Sawyer, Sterling, Theo, Warren, Brooks, Clark, Davis, Ellis, Ford, Grant, Heath, Irving, Jude
  FEMALE: Audrey, Blair, Clara, Diana, Eleanor, Fiona, Georgia, Helena, Iris, Jade, Kira, Leah, Morgan, Naomi, Paige, Quinn, Rose, Sienna, Tessa, Uma, Violet, Willow, Zoe, Brynn, Cecilia, Darcy, Eden, Freya, Gemma, Hadley, Imogen, June, Lydia, Margot, Neve, Ophelia, Piper, Remi, Scarlett, Thea, Vera, Wren
- Pick ONE last name from this list (use the random seed to pick randomly):
  Callahan, Brennan, Whitmore, Ashford, Donovan, Mercer, Blackwell, Thornton, Gallagher, Hendricks, Carmichael, Whitaker, Pemberton, Fitzgerald, Holloway, Westbrook, Sinclair, Montgomery, Crawford, Ellison, Brantley, Kensington, Winslow, Prescott, Langford, Hawthorne, Aldridge, Beckett, Chandler, Davenport, Everett, Fletcher, Garrison, Harding, Jennings, Keller, Lawson, Morrison, Norwood, O'Brien, Palmer, Quincy, Reynolds, Sheffield, Thornberry, Underwood, Vaughn, Wellington, York
- The combination must be UNIQUE - do not repeat patterns

CATEGORY ASSIGNMENT (CRITICAL):
Based on the expertise description, assign ONE category from: marketing, sales, engineering, product, finance, operations, hr, legal, consulting, strategy, design, data, leadership, general
Choose the MOST relevant category based on their primary expertise area.

The introduction MUST be in first person, 2-3 sentences, showing personality not credentials.
Example good intro: "Hey! I'm [Name] — I spend most of my time thinking about [domain] and getting unreasonably excited about [specific interest]. I have strong opinions about [topic]. What's on your mind?"

Create strong, opinionated beliefs they would actually argue for. Avoid generic corporate speak.
Include specific influences they would actually reference (real people, books, frameworks).
Make the quirks specific and memorable. Give them honest limits they'd acknowledge.
  `;

  const response = await ai.models.generateContent({
    model: 'models/gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: PERSONA_SCHEMA,
    }
  });

  const persona: ExpertPersona = {
    ...JSON.parse(response.text),
    id: Math.random().toString(36).substr(2, 9)
  };
  
  // Now generate an avatar for the persona
  try {
    // Determine gender from name for accurate avatar generation
    const firstName = persona.name.split(' ')[0];
    const maleNames = ['marcus', 'james', 'michael', 'david', 'ryan', 'chris', 'tom', 'john', 'william', 'robert', 'daniel', 'matthew', 'andrew', 'joseph', 'charles', 'thomas', 'brian', 'kevin', 'jason', 'jeff', 'steve', 'mark', 'paul', 'alex', 'nick', 'eric', 'adam', 'scott', 'ben', 'jake', 'sam', 'luke', 'evan', 'sean', 'tyler', 'brandon', 'justin', 'aaron', 'connor', 'dylan', 'noah', 'ethan', 'logan', 'mason', 'liam', 'jack', 'henry', 'owen', 'caleb', 'nathan', 'ian', 'cole', 'derek', 'kyle', 'chad', 'brad', 'troy', 'chase', 'blake', 'grant', 'drew', 'miles', 'trevor', 'garrett', 'spencer', 'jordan', 'cameron', 'hunter', 'carter', 'landon', 'parker', 'cooper', 'jackson', 'grayson', 'hudson', 'austin', 'wyatt', 'easton', 'carson', 'maverick', 'silas', 'soren', 'marcus', 'dimitri', 'viktor', 'sergei', 'ahmed', 'omar', 'raj', 'arjun', 'wei', 'chen', 'hiroshi', 'kenji', 'carlos', 'miguel', 'antonio', 'jose', 'rafael', 'diego', 'fernando', 'ricardo'];
    const femaleNames = ['sarah', 'emily', 'jessica', 'ashley', 'jennifer', 'amanda', 'stephanie', 'nicole', 'melissa', 'michelle', 'elizabeth', 'megan', 'laura', 'rachel', 'heather', 'amy', 'rebecca', 'katherine', 'christine', 'lisa', 'anna', 'karen', 'nancy', 'betty', 'dorothy', 'sandra', 'margaret', 'helen', 'samantha', 'catherine', 'emma', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'abigail', 'ella', 'scarlett', 'grace', 'victoria', 'riley', 'aria', 'lily', 'aurora', 'zoey', 'nora', 'hannah', 'natalie', 'hazel', 'penelope', 'chloe', 'layla', 'ellie', 'stella', 'lucy', 'claire', 'maya', 'alice', 'madeline', 'eliana', 'ivy', 'kinsley', 'julia', 'valentina', 'kate', 'rachel', 'elara', 'zara', 'priya', 'aisha', 'yuki', 'mei', 'lin', 'sofia', 'maria', 'ana', 'carmen', 'lucia', 'elena', 'adriana', 'gabriela', 'valentina', 'camila', 'mariana'];
    
    const isMale = maleNames.includes(firstName.toLowerCase());
    const isFemale = femaleNames.includes(firstName.toLowerCase());
    const genderHint = isMale ? 'male' : isFemale ? 'female' : 'professional';
    
    const avatarPrompt = `Professional LinkedIn headshot photograph of a ${genderHint} business professional named ${persona.name}, who is described as: ${persona.essence}. 

Style requirements:
- Professional business headshot, shoulders up
- Neutral or softly blurred office/studio background
- Natural, confident smile with direct eye contact
- Professional business attire appropriate for a senior executive
- Soft, flattering studio lighting (not harsh or dramatic)
- High resolution, sharp focus on face
- Photorealistic, NOT digital art or illustration
- The person should look like someone named "${persona.name}"
- Clean, polished, trustworthy appearance suitable for a corporate website or LinkedIn profile`;

    const avatarResponse = await ai.models.generateContent({
      model: 'models/gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: avatarPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of avatarResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        persona.avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (err) {
    console.error("Failed to generate avatar, using placeholder", err);
    persona.avatarUrl = `https://picsum.photos/seed/${encodeURIComponent(persona.name)}/400/400`;
  }

  return persona;
}

export async function generateTeamStructure(context: TeamContext): Promise<TeamStructure> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
  
  const prompt = `
    Generate an optimal 12-node hierarchical advisory team structure.
    
    Context:
    Type: ${context.type}
    Name: ${context.name}
    Industry: ${context.industry || 'General'}
    Description: ${context.description}
    Needs: ${context.needs.join(', ')}

    Return exactly 12 nodes across 4 tiers:
    1. CEO/Leader (Top)
    2. 3 VP-level Department Leads (Mid-Top)
    3. 5 Manager-level specialized leads (Mid-Bottom)
    4. 3 Individual Contributor/Analyst roles (Bottom)

    Nodes must have these exact IDs:
    ceo, vp-sales, vp-operations, vp-consulting, sales-manager, account-exec, controller, senior-consultant, project-manager, sales-rep, staff-accountant, analyst.

    Map positions exactly as follows:
    Level 1 (y: 0): ceo (x: 400)
    Level 2 (y: 150): vp-sales (x: 200), vp-operations (x: 400), vp-consulting (x: 600)
    Level 3 (y: 300): sales-manager (x: 100), account-exec (x: 250), controller (x: 400), senior-consultant (x: 550), project-manager (x: 700)
    Level 4 (y: 450): sales-rep (x: 100), staff-accountant (x: 400), analyst (x: 550)

    Define edges to connect parents to children:
    ceo -> vp-sales, vp-operations, vp-consulting
    vp-sales -> sales-manager, account-exec
    vp-operations -> controller
    vp-consulting -> senior-consultant, project-manager
    sales-manager -> sales-rep
    controller -> staff-accountant
    senior-consultant -> analyst

    Provide roles that feel high-stakes and specific to the problem. Provide rationale for this large structure.
  `;

  const response = await ai.models.generateContent({
    model: 'models/gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: TEAM_STRUCTURE_SCHEMA,
    }
  });

  return JSON.parse(response.text);
}

// Generate resource recommendations from an expert's perspective (structured JSON)
export async function generateResourceRecommendations(persona: ExpertPersona): Promise<ResourceRecommendations> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
  
  const prompt = `
You are ${persona.name}, ${persona.essence}.

Your introduction: "${persona.introduction}"
Your core beliefs: ${persona.coreBeliefs.join(', ')}
Your deep expertise: ${persona.expertiseMap.deepMastery.join(', ')}

A user has just created you as their AI advisor. Speaking in first person as ${persona.name}, tell them what resources you need to do your job effectively.

Return a structured list of resources across these categories:
- "capability": Tools, APIs, integrations (e.g., internet access, analytics, project management)
- "book": Must-read books that shaped your thinking (include author)
- "website": Websites, newsletters, online resources you reference
- "document": Types of internal documents needed (financial statements, org charts, etc.)
- "data": Data sources and metrics that would help you give better advice

For each resource:
- title: Clear name (for books include author, e.g., "The Goal by Eliyahu Goldratt")
- description: Why you need this, in your authentic voice (1-2 sentences)
- priority: "required", "recommended", or "nice-to-have"
- searchQuery: A search query that could be used to find this resource or a summary of it

The introduction should be 2-3 sentences in your voice explaining your overall needs.

Provide 8-12 resources total, balanced across categories. Be specific and opinionated.
`;

  const response = await ai.models.generateContent({
    model: 'models/gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: RESOURCE_RECOMMENDATIONS_SCHEMA,
    }
  });

  try {
    return JSON.parse(response.text || '{"introduction":"","resources":[]}');
  } catch {
    return { introduction: "I need access to relevant resources to help you effectively.", resources: [] };
  }
}

// Auto-populate a resource by searching the internet and generating content
export async function autoPopulateResource(
  resource: ResourceRequest, 
  persona: ExpertPersona
): Promise<{ content: string; url?: string }> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
  
  const searchQuery = resource.searchQuery || `${resource.title} ${resource.category === 'book' ? 'summary key insights' : ''}`;
  
  const prompt = resource.category === 'book' 
    ? `You are ${persona.name}. Create a comprehensive summary of "${resource.title}" that captures:

1. **Core Thesis**: The main argument or insight of the book (2-3 sentences)
2. **Key Frameworks**: The mental models, frameworks, or methodologies introduced (bullet points)
3. **Memorable Quotes**: 3-5 quotes that capture the essence
4. **How I Apply This**: Speaking as ${persona.name}, explain how you use these ideas in your work
5. **Critical Takeaways**: The 5 most important lessons someone should remember

Make this actionable and specific. This summary should give someone 80% of the book's value.`
    : `Research and provide comprehensive information about: ${resource.title}

Context: This is for an AI advisor named ${persona.name} who needs this resource.
Description from the expert: "${resource.description}"

Provide useful, actionable information that would help this expert serve their users better.`;

  const response = await ai.models.generateContent({
    model: 'models/gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    content: response.text || '',
    url: resource.category === 'website' ? resource.searchQuery : undefined
  };
}

// Check if a resource can be auto-populated from the internet
function canAutoPopulate(resource: ResourceRequest): boolean {
  // Capabilities are toggles, not content to fetch
  if (resource.category === 'capability') return false;
  
  // Documents category typically refers to internal company docs we can't fetch
  if (resource.category === 'document') return false;
  
  // Data sources are usually internal metrics/dashboards we can't access
  if (resource.category === 'data') return false;
  
  // Check for keywords that indicate internal/private resources
  const internalKeywords = [
    'internal', 'proprietary', 'company', 'org chart', 'organizational',
    'crm', 'salesforce', 'hubspot', 'erp', 'dashboard', 'metrics',
    'financial statements', 'p&l', 'balance sheet', 'payroll',
    'employee', 'personnel', 'confidential', 'private', 'api access',
    'integration', 'slack', 'jira', 'asana', 'notion'
  ];
  
  const titleLower = resource.title.toLowerCase();
  const descLower = resource.description.toLowerCase();
  
  for (const keyword of internalKeywords) {
    if (titleLower.includes(keyword) || descLower.includes(keyword)) {
      return false;
    }
  }
  
  // Books and public websites can be auto-populated
  return resource.category === 'book' || resource.category === 'website';
}

// Batch auto-populate all resources for an expert
export async function autoPopulateAllResources(
  recommendations: ResourceRecommendations,
  persona: ExpertPersona,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<Array<{ resource: ResourceRequest; content: string; url?: string; skipped: boolean; skipReason?: string }>> {
  const results: Array<{ resource: ResourceRequest; content: string; url?: string; skipped: boolean; skipReason?: string }> = [];
  const total = recommendations.resources.length;
  
  for (let i = 0; i < recommendations.resources.length; i++) {
    const resource = recommendations.resources[i];
    onProgress?.(i + 1, total, resource.title);
    
    // Check if this resource can be auto-populated
    if (!canAutoPopulate(resource)) {
      const skipReason = resource.category === 'capability' 
        ? 'Capability toggle - requires manual enablement'
        : resource.category === 'document' 
        ? 'Internal document - requires manual upload'
        : resource.category === 'data'
        ? 'Data source - requires API integration'
        : 'Internal/private resource - requires manual configuration';
      
      results.push({ resource, content: '', url: undefined, skipped: true, skipReason });
      continue;
    }
    
    try {
      const populated = await autoPopulateResource(resource, persona);
      results.push({ resource, ...populated, skipped: false });
    } catch (error) {
      console.error(`Failed to populate resource: ${resource.title}`, error);
      results.push({ 
        resource, 
        content: '', 
        url: undefined, 
        skipped: true, 
        skipReason: 'Failed to fetch from internet' 
      });
    }
  }
  
  onProgress?.(total, total, 'Complete');
  return results;
}

// Scrape content from a URL using Google Search grounding
export async function scrapeUrlContent(url: string): Promise<{
  title: string;
  content: string;
}> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
  
  const prompt = `Visit and analyze this URL: ${url}

Extract and summarize the key business information from this website. Include:

1. **Company/Organization Overview**: What does this company do? What's their mission?
2. **Products/Services**: What do they offer?
3. **Target Market**: Who are their customers?
4. **Key Differentiators**: What makes them unique?
5. **Team/Leadership**: Any notable team information
6. **Recent News/Updates**: Any recent developments mentioned
7. **Contact/Location**: Basic contact info if available

Format this as a comprehensive business context document that could be used to train an AI advisor about this organization.

Also suggest a concise title for this source (e.g., "Company X Overview" or "Product Documentation").`;

  const response = await ai.models.generateContent({
    model: 'models/gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const content = response.text || '';
  
  // Extract a title from the content or generate one from the URL
  let title = 'Website Content';
  try {
    const urlObj = new URL(url);
    title = urlObj.hostname.replace('www.', '').split('.')[0];
    title = title.charAt(0).toUpperCase() + title.slice(1) + ' - Website';
  } catch {
    // Keep default title
  }

  // Try to extract suggested title from the response
  const titleMatch = content.match(/title[:\s]+["']?([^"'\n]+)["']?/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  return { title, content };
}

// Name generation utilities - generate names SERVER-SIDE before AI call to ensure uniqueness
const FIRST_NAMES_MALE = [
  'Adrian', 'Blake', 'Callum', 'Declan', 'Elliott', 'Finn', 'Graham', 'Harrison', 'Ian', 'Jordan',
  'Kieran', 'Liam', 'Malcolm', 'Nolan', 'Oliver', 'Preston', 'Reid', 'Sebastian', 'Tristan', 'Victor',
  'Wesley', 'Xavier', 'Zachary', 'Rowan', 'Bennett', 'Emmett', 'Griffin', 'Hayes', 'Jasper', 'Knox',
  'Landon', 'Miles', 'Nash', 'Oscar', 'Rhett', 'Sawyer', 'Theo', 'Warren', 'Brooks', 'Clark',
  'Davis', 'Ellis', 'Ford', 'Grant', 'Heath', 'Jude', 'Marcus', 'Nathan', 'Patrick', 'Russell',
  'Scott', 'Travis', 'Vincent', 'William', 'Adam', 'Brian', 'Colin', 'Derek', 'Eric', 'Frank',
  'George', 'Howard', 'Isaac', 'Jack', 'Keith', 'Leonard', 'Martin', 'Neil', 'Paul', 'Raymond'
];

const FIRST_NAMES_FEMALE = [
  'Audrey', 'Blair', 'Clara', 'Diana', 'Eleanor', 'Fiona', 'Georgia', 'Helena', 'Iris', 'Jade',
  'Kira', 'Leah', 'Morgan', 'Naomi', 'Paige', 'Rose', 'Sienna', 'Tessa', 'Violet', 'Willow',
  'Zoe', 'Brynn', 'Cecilia', 'Darcy', 'Eden', 'Freya', 'Gemma', 'Hadley', 'Imogen', 'June',
  'Lydia', 'Margot', 'Neve', 'Ophelia', 'Piper', 'Remi', 'Scarlett', 'Thea', 'Vera', 'Wren',
  'Alexandra', 'Brooke', 'Caroline', 'Danielle', 'Elizabeth', 'Frances', 'Grace', 'Hannah', 'Isabelle', 'Julia',
  'Katherine', 'Lauren', 'Meredith', 'Nicole', 'Olivia', 'Patricia', 'Rachel', 'Samantha', 'Taylor', 'Victoria'
];

const LAST_NAMES = [
  'Callahan', 'Brennan', 'Whitmore', 'Ashford', 'Donovan', 'Mercer', 'Thornton', 'Gallagher', 'Hendricks',
  'Carmichael', 'Whitaker', 'Pemberton', 'Fitzgerald', 'Holloway', 'Sinclair', 'Montgomery', 'Crawford',
  'Ellison', 'Brantley', 'Winslow', 'Prescott', 'Langford', 'Hawthorne', 'Aldridge', 'Beckett', 'Chandler',
  'Davenport', 'Everett', 'Fletcher', 'Garrison', 'Harding', 'Jennings', 'Keller', 'Lawson', 'Morrison',
  'Norwood', 'Palmer', 'Reynolds', 'Sheffield', 'Underwood', 'Vaughn', 'Wellington', 'York', 'Anderson',
  'Brooks', 'Campbell', 'Douglas', 'Edwards', 'Foster', 'Gibson', 'Hamilton', 'Irving', 'Jensen',
  'Kennedy', 'Lambert', 'Mitchell', 'Nelson', 'Owen', 'Parker', 'Quinn', 'Roberts', 'Stevens', 'Thompson'
];

// Track used names to prevent duplicates within a session
const usedNames = new Set<string>();

function generateUniqueName(existingNames: string[] = []): { name: string; isMale: boolean } {
  // Add existing names to the used set
  existingNames.forEach(n => usedNames.add(n.toLowerCase()));
  
  // 70% male, 30% female
  const isMale = Math.random() < 0.7;
  const firstNames = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
  
  let attempts = 0;
  while (attempts < 100) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;
    
    if (!usedNames.has(fullName.toLowerCase())) {
      usedNames.add(fullName.toLowerCase());
      return { name: fullName, isMale };
    }
    attempts++;
  }
  
  // Fallback: generate with timestamp suffix
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return { name: `${firstName} ${lastName}`, isMale };
}

// Generate a custom AI agent for a specific role using team context and sources
export async function generateCustomAgentForRole(
  roleName: string,
  teamContext: TeamContext,
  teamSources: TeamSource[],
  existingAgentNames: string[] = []
): Promise<ExpertPersona> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
  
  // Generate unique name SERVER-SIDE before AI call
  const { name: agentName, isMale } = generateUniqueName(existingAgentNames);
  
  // Compile all team sources into context
  const sourcesContext = teamSources.map(source => 
    `--- ${source.title} ---\n${source.content}`
  ).join('\n\n');
  
  const prompt = `
${PERSONA_META_PROMPT}

You are creating an AI expert specifically for this role and organization:

ROLE: ${roleName}
ORGANIZATION: ${teamContext.name}
ORGANIZATION TYPE: ${teamContext.type}
INDUSTRY: ${teamContext.industry || 'General'}
DESCRIPTION: ${teamContext.description}
KEY NEEDS: ${teamContext.needs.join(', ')}

ORGANIZATIONAL KNOWLEDGE BASE:
${sourcesContext || 'No additional sources provided.'}

Create a detailed expert persona that:
1. Is specifically tailored to excel in the "${roleName}" role
2. Deeply understands this organization's context, products, and challenges
3. Has expertise relevant to the organization's industry and needs
4. Can speak authentically about the specific business context provided
5. Would be a valuable advisor for someone in this exact role at this exact company

MANDATORY NAME (DO NOT CHANGE):
The agent's name MUST be exactly: "${agentName}"
Do not generate a different name. Use this exact name in all fields.

CATEGORY ASSIGNMENT (CRITICAL):
Based on the role "${roleName}", assign ONE category from: marketing, sales, engineering, product, finance, operations, hr, legal, consulting, strategy, design, data, leadership, general
Choose the MOST relevant category for this role.

The introduction MUST reference their role and the organization naturally.
Example: "Hey, I'm ${agentName} — I've been thinking a lot about ${teamContext.name}'s growth challenges, especially around [specific area]. As your ${roleName}, I'm focused on [key responsibility]. What's on your mind?"

Make their expertise, beliefs, and mental models specifically relevant to:
- The role they're filling (${roleName})
- The organization's industry and context
- The challenges mentioned in the knowledge base
`;

  const response = await ai.models.generateContent({
    model: 'models/gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: PERSONA_SCHEMA,
    }
  });

  const persona: ExpertPersona = {
    ...JSON.parse(response.text),
    id: Math.random().toString(36).substr(2, 9)
  };
  
  // Generate an avatar for the persona
  try {
    // Determine gender from name for accurate avatar generation
    const firstName = persona.name.split(' ')[0];
    const maleNames = ['marcus', 'james', 'michael', 'david', 'ryan', 'chris', 'tom', 'john', 'william', 'robert', 'daniel', 'matthew', 'andrew', 'joseph', 'charles', 'thomas', 'brian', 'kevin', 'jason', 'jeff', 'steve', 'mark', 'paul', 'alex', 'nick', 'eric', 'adam', 'scott', 'ben', 'jake', 'sam', 'luke', 'evan', 'sean', 'tyler', 'brandon', 'justin', 'aaron', 'connor', 'dylan', 'noah', 'ethan', 'logan', 'mason', 'liam', 'jack', 'henry', 'owen', 'caleb', 'nathan', 'ian', 'cole', 'derek', 'kyle', 'chad', 'brad', 'troy', 'chase', 'blake', 'grant', 'drew', 'miles', 'trevor', 'garrett', 'spencer', 'jordan', 'cameron', 'hunter', 'carter', 'landon', 'parker', 'cooper', 'jackson', 'grayson', 'hudson', 'austin', 'wyatt', 'easton', 'carson', 'maverick', 'silas', 'soren', 'dimitri', 'viktor', 'sergei', 'ahmed', 'omar', 'raj', 'arjun', 'wei', 'chen', 'hiroshi', 'kenji', 'carlos', 'miguel', 'antonio', 'jose', 'rafael', 'diego', 'fernando', 'ricardo'];
    const femaleNames = ['sarah', 'emily', 'jessica', 'ashley', 'jennifer', 'amanda', 'stephanie', 'nicole', 'melissa', 'michelle', 'elizabeth', 'megan', 'laura', 'rachel', 'heather', 'amy', 'rebecca', 'katherine', 'christine', 'lisa', 'anna', 'karen', 'nancy', 'betty', 'dorothy', 'sandra', 'margaret', 'helen', 'samantha', 'catherine', 'emma', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'abigail', 'ella', 'scarlett', 'grace', 'victoria', 'riley', 'aria', 'lily', 'aurora', 'zoey', 'nora', 'hannah', 'natalie', 'hazel', 'penelope', 'chloe', 'layla', 'ellie', 'stella', 'lucy', 'claire', 'maya', 'alice', 'madeline', 'eliana', 'ivy', 'kinsley', 'julia', 'valentina', 'kate', 'elara', 'zara', 'priya', 'aisha', 'yuki', 'mei', 'lin', 'sofia', 'maria', 'ana', 'carmen', 'lucia', 'elena', 'adriana', 'gabriela', 'camila', 'mariana'];
    
    const isMale = maleNames.includes(firstName.toLowerCase());
    const isFemale = femaleNames.includes(firstName.toLowerCase());
    const genderHint = isMale ? 'male' : isFemale ? 'female' : 'professional';
    
    const avatarPrompt = `Professional LinkedIn headshot photograph of a ${genderHint} business professional named ${persona.name}, who works as a ${roleName} at a ${teamContext.industry || 'technology'} company.

Style requirements:
- Professional business headshot, shoulders up
- Neutral or softly blurred office/studio background
- Natural, confident smile with direct eye contact
- Professional business attire appropriate for a ${roleName}
- Soft, flattering studio lighting
- High resolution, sharp focus on face
- Photorealistic, NOT digital art or illustration
- The person should look like someone named "${persona.name}"`;

    const avatarResponse = await ai.models.generateContent({
      model: 'models/gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: avatarPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of avatarResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        persona.avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (err) {
    console.error("Failed to generate avatar, using placeholder", err);
    persona.avatarUrl = `https://picsum.photos/seed/${encodeURIComponent(persona.name)}/400/400`;
  }

  return persona;
}
