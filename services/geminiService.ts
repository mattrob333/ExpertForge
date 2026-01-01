
import { GoogleGenAI, Type } from "@google/genai";
import { ExpertPersona, PersonalityDirection, TeamContext, TeamStructure } from "../types";

const PERSONA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    essence: { type: Type.STRING },
    introduction: { type: Type.STRING },
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
    "name", "essence", "introduction", "stats", "coreBeliefs", 
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

export async function generateExpertPersona(description: string, direction?: PersonalityDirection): Promise<ExpertPersona> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Create a detailed and visually stunning expert persona based on the following description: "${description}".
    ${direction ? `The persona should have a ${direction} personality direction.` : ''}
    
    The response must be a comprehensive "dossier" for this knowledge worker.
    Include deep mastery skills, mental models they use, core beliefs, and their conversational style.
    The introduction should be in the first-person, capturing their unique voice.
    Be creative and avoid generic corporate speak. Use the character's specific domain knowledge to inform their quirks and influences.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    const avatarResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Professional cinematic headshot portrait of a person who is a ${persona.essence}. Digital art style, futuristic lighting, high detail, sharp focus, 8k resolution.` }
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: TEAM_STRUCTURE_SCHEMA,
    }
  });

  return JSON.parse(response.text);
}
