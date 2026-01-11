<div align="center">
<img width="1200" height="475" alt="ExpertForge Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ExpertForge

**AI-Powered Expert Persona & Advisory Team Builder**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase)](https://supabase.com)

</div>

---

## Overview

ExpertForge transforms generic AI outputs into **domain-specific expert personas** with deep personality profiles, mental models, and expertise maps. Build complete **AI advisory teams** with organizational hierarchies, assign agents to roles, and chat with your experts in context.

### Key Capabilities

- 🧠 **Expert Persona Generation** - Create detailed AI personas with beliefs, mental models, expertise tiers, and unique personalities
- 👥 **Dynamic Advisory Teams** - Generate 5-12 node hierarchical team structures that scale based on company size
- 📊 **Interactive Org Charts** - React Flow visualization with role-based color coding and Dagre layout
- 💬 **Team Chat with Cascading Responses** - Chat with all agents simultaneously; they @mention each other and respond in sequence
- ⚡ **Silent Director Mode** - AI orchestrator animates expert personas to debate naturally from authentic worldviews; includes debate staging, sequential streaming, and actionable summaries
- 🏢 **Department Filtering** - Filter team chat by department (Marketing, Sales, Technology, etc.)
- 🎯 **Team-Scoped Agents** - Agents are filtered by team, keeping workspaces separate
- 📋 **Thread Synthesis** - AI-powered summarization of chat discussions into actionable reports
- 🏆 **Legendary Business Minds** - Draft cognitive templates of Bezos, Jobs, Musk, Buffett, and more
- 🔗 **URL Scraping** - Import company context by scraping website content with Google Search grounding
- 🌟 **Famous Figure Detection** - Automatically detects real-world famous people and fetches their actual photos
- 🎨 **Cyberpunk UI** - Dark theme with cyan/purple glow accents and glassmorphism effects

---

## Screenshots

| Landing Page | Team Builder | Role Workspace |
|:---:|:---:|:---:|
| Marketing page with pricing | Org chart with drag-and-drop | Full role management modal |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/expertforge.git
cd expertforge

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Add your API keys to .env
# VITE_API_KEY=your_gemini_api_key

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Required: Google Gemini API Key
VITE_API_KEY=your_gemini_api_key

# Optional: Supabase (uses localStorage fallback if not set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Stripe for payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to your `.env` file

---

## Features Deep Dive

### Expert Persona Generation

Each generated expert includes:
- **Core Identity**: Name, essence, introduction, avatar
- **Expertise Map**: Deep mastery, working knowledge, growth areas
- **Mental Models**: Frameworks and thinking patterns
- **Core Beliefs**: Opinionated stances they'll defend
- **Personality**: Communication style, quirks, honest limits
- **Influences**: Books, people, and frameworks they reference

### Team Builder

The Team Builder creates organizational structures with:
- **12-Node Hierarchies**: CEO, VPs, Directors, Managers, Specialists
- **Role-Specific Agents**: Generate AI tailored to each position
- **Knowledge Sources**: Add company context via text, files, or URL scraping
- **Human Assignment**: Track which humans fill which roles
- **Backup Advisors**: Assign legendary business minds as fallback consultants

### Role Workspace

Click any node in the org chart to open the Role Workspace:
- **Left Panel**: Primary agent, human team member, backup advisor, sub-agents
- **Center Panel**: Chat interface with the assigned agent
- **Right Panel**: Knowledge sources and quick actions
- **Persistence**: Assignments save automatically to localStorage

### Silent Director Mode (Oracle Mode)

An AI orchestrator that animates expert personas to debate naturally from their authentic worldviews:

- **Debate Stage Structuring**: AI clarifies your raw input into a proper debate format
  - Clarified question (what you're really asking)
  - User intent (what you're trying to decide)
  - Desired outcome (what success looks like)
  - Key considerations (factors to address)
- **Natural Persona Debate**: No assigned stances—friction emerges from worldview collision
- **Sequential Streaming**: Personas speak one at a time with visual "thinking" indicator
- **Left/Right Chat Layout**: WhatsApp-style alternating bubbles for easy reading
- **Short Descriptors**: 2-4 word context under each speaker's name
- **File Upload for Context**: Attach `.txt`, `.md`, `.json` files (up to 50KB) for personas to reference
- **Debate Summary**: Structured output capturing:
  - Key insights and agreements
  - Productive tensions
  - Specific recommendations
  - Per-persona contributions
  - Bottom line synthesis

### Legends Library

Pre-built cognitive templates based on documented thinking patterns:
- Jeff Bezos - Customer Obsessed Operator
- Steve Jobs - The Taste Architect  
- Elon Musk - First Principles Disruptor
- Warren Buffett - Value Investing Oracle
- Alex Hormozi - Offer Creation Strategist
- And more...

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript 5, Vite 7 |
| **AI** | Google Gemini API (`@google/genai`) with structured output schemas |
| **Visualization** | React Flow, Dagre layout algorithm |
| **Styling** | Tailwind CSS (CDN), custom cyberpunk theme |
| **Auth** | Supabase Auth (email/password, Google OAuth) |
| **Database** | Supabase PostgreSQL, localStorage fallback |
| **Payments** | Stripe (optional) |

---

## Project Structure

```
ExpertForge/
├── components/              # React components
│   ├── AuthPage.tsx         # Login/signup UI
│   ├── HomeDashboard.tsx    # Main dashboard with experts & teams
│   ├── ExpertCard.tsx       # Detailed persona dossier view
│   ├── EmergentChat.tsx     # Oracle Mode - intellectual emergence system
│   ├── LandingPage.tsx      # Marketing page with pricing
│   ├── LegendCard.tsx       # Legend persona cards
│   ├── LegendProfile.tsx    # Detailed legend profile view
│   ├── TeamBuilder.tsx      # Org chart + Role Workspace modal
│   ├── TeamChat.tsx         # Multi-agent chat interface
│   ├── TeamSetup.tsx        # Team configuration wizard (with Coming Soon overlays)
│   ├── UnifiedProfileCard.tsx # Unified card for personas & legends (full/compact/mini)
│   └── PricingSection.tsx   # Subscription tiers
├── data/
│   └── legends.ts           # Pre-built legendary personas
├── lib/
│   ├── supabase.ts          # Supabase client & auth
│   ├── stripe.ts            # Stripe integration
│   └── layoutOrgChart.ts    # Dagre layout helpers
├── services/
│   ├── geminiService.ts     # AI generation (personas, teams, scraping)
│   ├── discourseService.ts  # Panel selection, stance assignment, emergence detection
│   └── storageService.ts    # Data persistence layer
├── supabase/
│   ├── schema.sql           # Main database schema
│   └── migrations/          # Schema migrations
├── public/
│   └── images/              # Legend avatar photos
├── types.ts                 # TypeScript interfaces (includes discourse types)
├── App.tsx                  # Main app with state machine
└── index.html               # Entry point
```

---

## API Reference

### Gemini Service Functions

| Function | Description |
|----------|-------------|
| `generateExpertPersona(description, direction?)` | Create a new expert persona |
| `generateTeamStructure(context)` | Generate 12-node team hierarchy |
| `generateCustomAgentForRole(role, context, sources)` | Create role-specific agent |
| `scrapeUrlContent(url)` | Extract business context from URL |
| `generateResourceRecommendations(persona)` | Get resource suggestions |
| `autoPopulateResource(resource, persona)` | Fetch resource content |

### Discourse Service Functions

| Function | Description |
|----------|-------------|
| `analyzeQuestion(question, context?)` | Analyze question for domains, tensions, cognitive needs |
| `selectDebatePanel(question, agents, legends, context?, maxSize?)` | Select optimal debate panel |
| `generatePositionStatement(expert, stance, question, context?)` | Generate expert's initial position |
| `generateChallenge(challenger, stance, target, position, question)` | Generate directed challenge |
| `generateRedTeamIntervention(history, question)` | Generate red team intervention |
| `attemptSynthesis(history, panel, question)` | Attempt synthesis of discourse |
| `detectEmergence(synthesis, history, panel, question)` | Evaluate emergence |
| `legendToExpert(legend)` | Convert Legend to ExpertPersona format |

### Storage Service Functions

| Function | Description |
|----------|-------------|
| `getExperts(userId)` / `saveExpert(persona, userId)` | Expert CRUD |
| `getAllTeams(userId)` / `saveTeamContext(context, userId)` | Team CRUD |
| `getTeamStructure(teamId)` / `saveTeamStructure(structure, teamId)` | Structure CRUD |
| `getTeamSources(teamId)` / `saveTeamSource(teamId, source)` | Sources CRUD |
| `getRoleAssignments(teamId)` / `saveRoleAssignments(teamId, assignments)` | Role assignments |

---

## Database Schema

### Tables

- **experts** - Generated AI personas
- **teams** - Team context (name, industry, needs)
- **team_structures** - Org chart nodes and edges
- **team_sources** - Knowledge base documents
- **expert_resources** - Per-expert resources and tools

See `supabase/schema.sql` for full schema.

---

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

---

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Vercel

1. Import project from GitHub
2. Framework preset: Vite
3. Add environment variables

---

## Roadmap

- [x] ~~Team chat with @mentions across all agents~~ ✅ Implemented
- [x] ~~Thread synthesis/export~~ ✅ Implemented
- [x] ~~Oracle Mode - Intellectual Emergence System~~ ✅ Implemented
- [x] ~~Cognitive style & orientation for agents~~ ✅ Implemented
- [x] ~~NAICS standardized job roles~~ ✅ Implemented
- [x] ~~Department filtering in team chat~~ ✅ Implemented
- [x] ~~Dynamic org chart scaling (5-12 nodes)~~ ✅ Implemented
- [x] ~~Famous figure detection with real avatars~~ ✅ Implemented
- [x] ~~Unified profile card component~~ ✅ Implemented
- [x] ~~Silent Director Mode (natural persona debates)~~ ✅ Implemented
- [x] ~~Debate stage structuring~~ ✅ Implemented
- [x] ~~Sequential streaming with thinking indicators~~ ✅ Implemented
- [x] ~~Left/right alternating chat layout~~ ✅ Implemented
- [x] ~~File upload for debate context~~ ✅ Implemented
- [ ] Sub-agent support for specialized role assistants
- [ ] Export team configurations as JSON
- [ ] Role analytics and performance tracking
- [ ] Voice chat with agents
- [ ] Mobile responsive improvements
- [ ] Discourse history persistence
- [ ] Cross-team debates

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ and AI**

[Report Bug](https://github.com/yourusername/expertforge/issues) · [Request Feature](https://github.com/yourusername/expertforge/issues)

</div>
