# ExpertForge Engineering Log

**Project**: ExpertForge - AI Expert Persona & Advisory Team Builder  
**Last Updated**: January 2, 2026  
**Status**: Active Development (MVP Complete)

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
| `services/storageService.ts` | Data persistence layer |
| `components/TeamBuilder.tsx` | Org chart + Role Workspace |
| `data/legends.ts` | Legendary persona definitions |
| `types.ts` | TypeScript interfaces |

---

## Recent Development Sessions

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
