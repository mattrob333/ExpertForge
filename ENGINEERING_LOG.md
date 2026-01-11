# ExpertForge Engineering Log

**Project**: ExpertForge - AI Expert Persona & Advisory Team Builder  
**Last Updated**: January 11, 2026  
**Status**: Active Development (Silent Director Mode Released)

---

## Project Overview

ExpertForge is an AI-powered platform that generates detailed expert personas and organizational advisory teams. Users can create AI advisors with deep personality profiles, build hierarchical team structures, and chat with their experts in the context of specific organizational roles.

---

## Current State Summary

### ✅ Completed Features

#### Core AI Generation
- [x] Expert persona generation using Gemini API with structured JSON schemas
- [x] Detailed persona profiles including beliefs, mental models, expertise maps
- [x] AI-generated avatars using Gemini image generation
- [x] Team structure generation (12-node hierarchies)
- [x] Custom agent generation for specific roles using organizational context
- [x] URL scraping with Google Search grounding for importing company context

#### User Interface
- [x] Landing page with marketing content and pricing tiers
- [x] Home dashboard showing experts and teams
- [x] Expert card detail view with full persona dossier
- [x] Team setup wizard for configuring new teams
- [x] Interactive org chart with React Flow visualization
- [x] Role Workspace modal (expanded 3-column layout)
- [x] Legends library with pre-built business mind templates
- [x] Cyberpunk dark theme with cyan/purple accents

#### Team Builder
- [x] 12-node organizational hierarchy visualization
- [x] Dagre layout algorithm for automatic positioning
- [x] Role-based color coding (executive purple, management cyan, etc.)
- [x] Click-to-expand Role Workspace modal
- [x] Assign AI agents to roles
- [x] Assign human team members
- [x] Assign legendary advisors as backups
- [x] Knowledge sources management (text, files, URLs)
- [x] Role assignment persistence to localStorage

#### Chat System
- [x] Role-based chat within Role Workspace
- [x] Chat with assigned agent in organizational context
- [x] Conversation history within session
- [x] Loading indicators and error handling

#### Authentication & Storage
- [x] Supabase authentication (email/password, Google OAuth)
- [x] Database schema for experts, teams, structures, sources
- [x] localStorage fallback when Supabase not configured
- [x] Role assignments persistence

#### Legends Feature
- [x] Pre-built legendary business mind personas
- [x] Jeff Bezos, Steve Jobs, Elon Musk, Warren Buffett, Alex Hormozi
- [x] Real avatar photos in public/images/
- [x] Draft-to-persona conversion functionality
- [x] Legends preview on landing page with actual photos

---

## Technical Architecture

### Frontend Stack
- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool and dev server
- **Tailwind CSS** - Styling (CDN)
- **React Flow** - Org chart visualization
- **Dagre** - Graph layout algorithm

### AI Integration
- **Google Gemini API** (`@google/genai`)
  - `gemini-2.0-flash` - Fast chat responses
  - `gemini-3-flash-preview` - Persona generation with structured schemas
  - `gemini-3-pro-image-preview` - Avatar generation
  - Google Search grounding for URL scraping

### Backend Services
- **Supabase** - PostgreSQL database + Auth
- **localStorage** - Fallback persistence
- **Stripe** - Payment integration (optional)

### Key Files
| File | Purpose |
|------|---------|
| `App.tsx` | Main state machine and routing |
| `services/geminiService.ts` | All AI generation functions |
| `services/discourseService.ts` | Oracle Mode panel selection & discourse engine |
| `services/storageService.ts` | Data persistence layer |
| `components/TeamBuilder.tsx` | Org chart + Role Workspace |
| `components/EmergentChat.tsx` | Oracle Mode UI component |
| `data/legends.ts` | Legendary persona definitions |
| `types.ts` | TypeScript interfaces (includes discourse types) |

---

## Recent Development Sessions

### Session: January 10-11, 2026 (Night) - Silent Director Mode

#### Overview
Complete reimagining of Oracle Mode as "Silent Director" - an AI orchestrator that animates expert personas to debate naturally from their authentic perspectives without assigned stances.

#### Features Implemented

1. **Silent Director Mode Core**
   - Replaced stance-based discourse with natural persona-driven debate
   - New `SILENT_DIRECTOR_PROMPT` - AI orchestrates without speaking
   - Personas debate from authentic worldviews (coreBeliefs, mentalModels, expertise)
   - No assigned positions - friction emerges naturally from worldview collision

2. **Debate Stage Structuring**
   - New `DebateStage` type to structure raw user input
   - `structureDebateStage()` function extracts:
     - Clarified question (what user is really asking)
     - User intent (what they're trying to decide)
     - Desired outcome (what success looks like)
     - Debate format (strategic decision, exploration, problem-solving, etc.)
     - Key considerations (factors to address)
   - Debate header displays structured context at top of discourse

3. **Sequential Streaming (One-at-a-Time)**
   - New `generateSingleExchange()` function - generates ONE persona response at a time
   - `getNextSpeaker()` determines who speaks next (round-robin)
   - Visual "thinking" indicator shows current speaker with bouncing dots
   - 800ms pause between exchanges for readability
   - Current speaker highlighted in panel chips with cyan ring

4. **Left/Right Alternating Chat Layout**
   - First persona messages on left (dark slate bubbles)
   - Second persona messages on right (purple/cyan gradient bubbles)
   - WhatsApp-style message tails (rounded corners with small notch)
   - Distinct visual styling per side for easy scanning

5. **Short Descriptors Under Names**
   - `getShortDescriptor()` extracts 2-4 word description from persona
   - Shows under name: "Elon Musk 🏆 / First-principles thinker"
   - Uses essence for legends, cognitive_style for custom agents
   - Provides instant context about speaker's perspective

6. **File Upload for Context**
   - Upload `.txt`, `.md`, `.json` files (max 50KB)
   - Content injected into debate context
   - Personas can reference uploaded company info, docs, etc.
   - Shows file name and size when attached
   - Easy removal with X button

7. **Debate Summary (Replaces Red Team)**
   - `generateDebateSummary()` produces structured JSON
   - Captures: keyInsights, agreements, tensions, recommendations
   - Contributions per persona
   - Bottom line synthesis
   - Clean summary view with categorized sections

#### Technical Changes

**New Types (`types.ts`)**
- `DebateStage` - structured debate format
- `DebateExchange` - individual message in debate
- `DebateSummary` - end-of-debate summary
- `SilentDirectorSession` - session state with debateStage

**New Functions (`discourseService.ts`)**
- `structureDebateStage(rawInput, context)` - AI structures user input
- `generateSingleExchange(persona, debateStage, previousExchanges, allPersonas)` - one response
- `getNextSpeaker(personas, previousExchanges)` - determines next speaker
- `generateDebateSummary(topic, exchanges, personas)` - summary generation
- `selectSilentDirectorPanel()` - panel selection without stances

**UI Changes (`EmergentChat.tsx`)**
- Added `uploadedFile` state and `fileInputRef`
- Added `currentSpeaker` state for streaming indicator
- Added `getShortDescriptor()` helper function
- Added `handleFileUpload()` and `removeUploadedFile()` handlers
- Added `generateStreamingExchanges()` for sequential generation
- Updated `renderInputView()` with file upload UI
- Updated `renderDiscourseView()` with left/right layout
- Added debate stage header with structured topic display

#### Files Modified
- `types.ts` - Added DebateStage, updated SilentDirectorSession
- `services/discourseService.ts` - New Silent Director functions
- `components/EmergentChat.tsx` - Complete UI overhaul

---

### Session: January 10, 2026 (Evening) - UI/UX Polish & Department Filtering

#### Features Implemented

1. **Database Schema: Department Field for Filtering**
   - Created `004_department_schema.sql` migration
   - Added `department` column to `org_node_agents` and `experts` tables
   - Added indexes for performance: `org_node_agents_department_idx`, `experts_department_idx`
   - Helper functions: `get_team_departments()`, `get_agents_by_department()`

2. **Role Assignments Persistence Fix**
   - Updated `storageService.ts` to persist role assignments to Supabase `org_node_agents` table
   - Uses upsert with `onConflict: 'team_id,node_id'` for proper updates
   - Falls back to localStorage if Supabase not configured
   - Saves department and roleTitle with each assignment

3. **Dynamic Org Chart Generation**
   - Modified `generateTeamStructure()` to scale based on company context
   - Startup/small: 5-7 nodes, Growth: 7-10 nodes, Enterprise: 10-12 nodes
   - CEO always present at top
   - Detects keywords: "startup", "early stage", "enterprise", "scaling"

4. **Team Setup UX Improvements**
   - Added "Coming Soon" overlays to "Hypothetical Startup" and "Project" cards
   - Wired "Problem to Solve / Debate" card directly to Oracle Mode
   - Oracle Mode card has fuchsia gradient styling with ⚡ badge
   - Disabled cards have reduced opacity and cursor-not-allowed

5. **Unified Profile Card Component**
   - Created `UnifiedProfileCard.tsx` with three variants: full, compact, mini
   - Normalizes data from both `ExpertPersona` and `Legend` types
   - Full variant: 320×460px holographic card with stats, mental models, expertise
   - Compact variant: horizontal card for lists
   - Mini variant: pill-style avatar + name
   - Category-specific accent colors for both legends and departments

6. **Famous Figure Detection & Real Avatar**
   - Added famous figure detection in `generateExpertPersona()`
   - Uses Gemini to check if name is a real-world famous person
   - Fetches real photo via Google Search grounding tool
   - Sets `isLegend: true` flag for famous figures

7. **UI Polish Updates**
   - Replaced "Log Out" with "Oracle Mode" button on HomeDashboard
   - Increased Quick Actions font size from `text-[10px]` to `text-xs`
   - Added collapsible rationale section in TeamBuilder sidebar
   - Department field added to ExpertPersona TypeScript interface

#### Files Modified
- `supabase/migrations/004_department_schema.sql` (new)
- `components/UnifiedProfileCard.tsx` (new)
- `services/storageService.ts` - Supabase persistence for role assignments
- `services/geminiService.ts` - Dynamic org chart, famous figure detection
- `components/TeamSetup.tsx` - Coming Soon overlays, Oracle Mode wiring
- `components/TeamBuilder.tsx` - Collapsible rationale, department persistence
- `components/HomeDashboard.tsx` - Oracle Mode button, larger fonts
- `App.tsx` - Oracle Mode state and TeamSetup wiring
- `types.ts` - Added department field to ExpertPersona

---

### Session: January 10, 2026 (Morning) - Oracle Mode Release

#### Features Implemented

1. **Oracle Mode - Intellectual Emergence System**
   - New `EmergentChat.tsx` component for structured intellectual discourse
   - Full-screen overlay interface with 4 views: input, panel, discourse, report
   - Question analysis identifies domains, tensions, and cognitive needs
   - Automatic panel selection from team agents + legendary advisors
   - Stance assignment ensures productive friction (Advocate, Skeptic, Devil's Advocate, Synthesizer)
   - Structured discourse phases: Position → Challenge → Red Team → Synthesis → Emergence

2. **Cognitive Architecture for Agents**
   - Added `cognitive_style` field based on Sternberg's Triarchic Theory (analytical, creative, practical)
   - Added `natural_orientation` for default debate stance (advocate, skeptical, neutral, contrarian, synthesizer)
   - Updated `PERSONA_SCHEMA` in geminiService.ts with new enum fields
   - Enhanced persona generation prompt to assign cognitive attributes

3. **Discourse Service (`discourseService.ts`)**
   - `analyzeQuestion()` - AI-powered question analysis for panel selection
   - `scoreExpertForQuestion()` - Relevance scoring based on expertise match
   - `ensureCognitiveDiversity()` - Guarantees all three cognitive styles represented
   - `assignStances()` - Maps natural orientations to discourse roles
   - `selectDebatePanel()` - Full panel selection algorithm
   - `generatePositionStatement()` - Initial position with stance injection
   - `generateChallenge()` - Directed challenges between experts
   - `generateRedTeamIntervention()` - Challenge shared assumptions
   - `attemptSynthesis()` - Integration of perspectives
   - `detectEmergence()` - Evaluate novelty and genuine emergence
   - `generateEmergenceReport()` - Final report with attribution

4. **Discourse Type System**
   - New types: `CognitiveStyle`, `NaturalOrientation`, `DiscourseStance`
   - `QuestionAnalysis` interface for AI question parsing
   - `DiscoursePanel` and `PanelMember` for panel configuration
   - `DiscourseMessage` with stance metadata and targeting
   - `EmergenceEvaluation` with novelty scoring
   - `EmergenceReport` for final output
   - `DiscourseSession` for complete session state

5. **UI Integration**
   - "Oracle Mode" button in TeamBuilder header (amber/purple gradient)
   - Panel review screen with stance dropdowns
   - Real-time discourse view with phase progress bar
   - Agent chips with stance indicators
   - Emergence report with novelty score and attribution
   - Copy synthesis to clipboard functionality

6. **Hover Card Z-Index Fix**
   - Fixed org chart hover cards appearing behind nodes
   - Used React Flow's `setNodes` to dynamically set `zIndex: 1000` on hovered nodes
   - Proper cleanup on mouse leave

---

### Session: January 2-3, 2026

#### Features Implemented

1. **Team Chat with Cascading Agent Responses**
   - Full team chat view in center panel (toggle between Org Chart and Team Chat)
   - CEO/top-level agent responds first to user messages
   - Agents can @mention other team members, triggering cascading responses
   - Up to 10 agent responses per conversation turn
   - Streaming responses with real-time UI updates
   - Google Search grounding for web research during responses

2. **Team-Scoped Expert Bench**
   - Agents now filtered by `teamId` in the Expert Bench sidebar
   - Agents created for Team A don't appear in Team B's workspace
   - Empty state shows "No agents for this team yet" when switching teams
   - Cross-team context contamination prevention with verification checks

3. **Server-Side Name Generation**
   - Moved name generation from AI prompt to server-side `Math.random()`
   - Prevents duplicate names within a session via `usedNames` Set
   - Existing agent names passed to prevent collisions
   - 70% male / 30% female ratio with natural English names

4. **Thread Synthesis Feature**
   - "Synthesize" button in chat header generates AI summary
   - Summary includes: Executive Summary, Key Decisions, Action Items, Open Questions, Recommendations
   - Auto-copies summary to clipboard
   - Displays summary as a special message in chat

5. **Improved Agent Response Quality**
   - Reduced rigid structure in prompts for more natural responses
   - Encouraged disagreement and productive tension between agents
   - Goal-oriented prompting: "Big Picture → Specific Actions"
   - Variable response lengths based on context

6. **UI/UX Improvements**
   - Sticky left/right sidebars with scrollable center chat
   - Fixed chat header and input bar
   - Agent roster pills clickable to add @mentions
   - Markdown rendering in chat messages (bold, italic, code, links)
   - Export thread button copies raw conversation to clipboard

7. **Bug Fixes**
   - Fixed @mention detection regex for partial names
   - Fixed chat cascade stopping after 4 responses (increased to 10)
   - Added context verification to prevent cross-team data contamination
   - Added detailed logging for debugging team context issues

---

### Session: January 1-2, 2026

#### Features Implemented

1. **Generate Custom Agent for Role**
   - New `generateCustomAgentForRole()` function in geminiService
   - Uses role name, team context, and all knowledge sources
   - Generates role-specific AI persona with avatar
   - Saves to expert library via `onExpertCreated` callback

2. **URL Scraping for Knowledge Sources**
   - New `scrapeUrlContent()` function with Google Search grounding
   - Extracts company overview, products, target market from URLs
   - Auto-fills title and content in Sources modal
   - Stores with `sourceType: 'url'`

3. **Expanded Role Workspace Modal**
   - Redesigned from small modal to full 3-column workspace (90vh)
   - Left panel: Primary agent, human, backup advisor, sub-agents
   - Center panel: Chat interface with agent selection
   - Right panel: Knowledge sources with quick actions
   - Professional styling with glassmorphism effects

4. **Role Chat Functionality**
   - `handleSendRoleChat()` function with Gemini API integration
   - Chat messages include organizational context and sources
   - Agent responds in character for their role
   - Typing indicators and conversation history

5. **Role Assignment Persistence**
   - New `RoleAssignment` interface in storageService
   - `getRoleAssignments()` and `saveRoleAssignments()` functions
   - Loads assignments when team is opened
   - Saves automatically when assignments change
   - Allows re-assigning existing experts to roles

6. **Landing Page Improvements**
   - Updated "Draft Legendary Business Minds" section
   - Uses actual legend photos from LEGENDS data
   - Improved card styling with hover effects and rank badges

7. **Persona Generation Tuning**
   - Adjusted naming to favor American/European/Australian names
   - Set gender ratio to 70% male, 30% female
   - Removed overly exotic naming requirements

8. **Bug Fixes**
   - Fixed Supabase type errors in storageService.ts (using `db` alias)
   - Fixed environment variable naming (`VITE_API_KEY`)
   - Fixed model name prefixes for Gemini API calls

---

## Database Schema

```sql
-- Core tables
experts (id, user_id, name, essence, avatar_url, introduction, ...)
teams (id, user_id, name, type, industry, description, needs)
team_structures (id, team_id, nodes, edges, rationale)
team_sources (id, team_id, title, content, source_type, file_name)
expert_resources (id, expert_id, title, description, resource_type, ...)

-- Role assignments (localStorage only for now)
role_assignments_{teamId} -> [{nodeId, expertId, legendId, humanName, ...}]
```

---

## Known Issues & Technical Debt

### Minor Issues
- [ ] Controlled input React warning occasionally appears
- [ ] Chat messages don't persist across sessions (by design for now)
- [ ] Sub-agents feature is UI placeholder only

### Technical Debt
- [ ] Supabase types should be auto-generated (`supabase gen types`)
- [ ] Role assignments should move to Supabase table
- [ ] Chat history could be persisted per role
- [ ] Consider rate limiting for AI generation

---

## Environment Configuration

```bash
# Required
VITE_API_KEY=<gemini_api_key>

# Optional (localStorage fallback if not set)
VITE_SUPABASE_URL=<supabase_url>
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>

# Optional
VITE_STRIPE_PUBLISHABLE_KEY=<stripe_key>
```

---

## Performance Notes

- Persona generation: ~5-10 seconds (includes avatar generation)
- Team structure generation: ~3-5 seconds
- URL scraping: ~2-4 seconds
- Role chat response: ~1-3 seconds

---

## Next Steps / Roadmap

### High Priority
- [ ] Implement functional sub-agents within roles
- [ ] Add team-wide chat with @mentions
- [ ] Export/import team configurations

### Medium Priority
- [ ] Role analytics dashboard
- [ ] Resource auto-population for experts
- [ ] Mobile responsive improvements

### Future Considerations
- [ ] Voice chat with agents
- [ ] Collaborative team editing
- [ ] API access for integrations
- [ ] Enterprise SSO

---

## Contributors

- Development: AI-assisted pair programming with Cascade
- Design: Cyberpunk aesthetic inspired by modern SaaS dashboards

---

## Changelog

### v0.5.0 (January 11, 2026) - Silent Director Mode
- Complete reimagining of Oracle Mode as "Silent Director"
- Personas debate naturally from authentic worldviews (no assigned stances)
- Debate Stage structuring - AI clarifies user intent and desired outcome
- Sequential streaming - one persona speaks at a time with thinking indicator
- Left/right alternating chat layout (WhatsApp-style)
- Short descriptors under persona names for instant context
- File upload for context (.txt, .md, .json up to 50KB)
- Debate summary replaces red team (insights, agreements, tensions, recommendations)
- New types: DebateStage, DebateExchange, DebateSummary
- New functions: structureDebateStage, generateSingleExchange, getNextSpeaker

### v0.4.1 (January 10, 2026)
- Added department field to database schema (migration 004)
- Fixed role assignments persistence to use Supabase org_node_agents table
- Dynamic org chart generation (5-12 nodes based on company size)
- Added "Coming Soon" overlays to Hypothetical Startup and Project cards
- Wired "Problem to Solve / Debate" directly to Oracle Mode
- Created UnifiedProfileCard.tsx component (full, compact, mini variants)
- Famous figure detection with real avatar fetching via Google Search
- Replaced Log Out with Oracle Mode button on dashboard
- Increased Quick Actions font size
- Added collapsible rationale section in TeamBuilder

### v0.4.0 (January 10, 2026)
- Added Oracle Mode - Intellectual Emergence System
- New EmergentChat.tsx component with full discourse UI
- New discourseService.ts with panel selection and stance assignment
- Added cognitive_style and natural_orientation to expert personas
- Added comprehensive discourse types to types.ts
- Panel selection algorithm with cognitive diversity enforcement
- Structured discourse phases: Position → Challenge → Red Team → Synthesis → Emergence
- Emergence detection with novelty scoring
- Fixed hover card z-index issue using React Flow node zIndex

### v0.3.0 (January 3, 2026)
- Added Team Chat with cascading agent responses and @mentions
- Added team-scoped Expert Bench (agents filtered by team)
- Added Thread Synthesis button for AI-powered summaries
- Added server-side name generation to prevent duplicates
- Improved agent response variety and conversational quality
- Added markdown rendering in chat messages
- Added export thread to clipboard feature
- Fixed cross-team context contamination bug
- Fixed @mention detection for partial names
- Increased max cascade responses from 4 to 10

### v0.2.0 (January 2, 2026)
- Added Role Workspace with full chat functionality
- Added custom agent generation for roles
- Added URL scraping for knowledge sources
- Added role assignment persistence
- Improved landing page legends display
- Fixed Supabase type errors
- Tuned persona generation for Western names

### v0.1.0 (Initial Release)
- Expert persona generation
- Team structure generation
- Interactive org charts
- Legends library
- Supabase auth integration
- Basic team management

---

*This log is maintained to track engineering progress and decisions for the ExpertForge project.*
