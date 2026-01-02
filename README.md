<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1htyLbRQ2mOBVTx9x8aFSxqGoBUsmPU-0

## ExpertForge

An AI-powered expert persona generator that transforms generic LLM outputs into domain-specific expert personas. Create detailed knowledge worker "dossiers" with deep personality profiles, mental models, expertise maps, and complete advisory board teams with organizational hierarchy visualizations.

## Features

- **Expert Persona Generation** - AI creates detailed dossiers with beliefs, mental models, expertise tiers
- **Advisory Board Teams** - Generate complete 12-node hierarchical team structures
- **Interactive Org Charts** - React Flow visualization with 3D stacked nodes and Dagre layout
- **Multi-Agent Chat** - Chat with personas individually or as a team with @mentions
- **Authentication** - Supabase Auth with email/password and Google OAuth
- **Payments** - Stripe integration for subscription tiers
- **Cyberpunk UI** - Dark theme with cyan/purple glow accents

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your keys
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```bash
# Required: Gemini API for AI generation
GEMINI_API_KEY=your_gemini_api_key

# Optional: Supabase for auth & persistence (uses localStorage fallback if not set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Stripe for payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `supabase/schema.sql` in your Supabase SQL Editor
3. Enable Google OAuth in Authentication > Providers (optional)
4. Add your Supabase URL and anon key to `.env.local`

## Stripe Setup (Optional)

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create products and prices in the Stripe Dashboard
3. Update price IDs in `lib/stripe.ts`
4. Add your publishable key to `.env.local`
5. Set up a backend endpoint for creating checkout sessions

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **AI**: Google Gemini API (`@google/genai`)
- **Visualization**: ReactFlow + Dagre for org charts
- **Styling**: Tailwind CSS (CDN)
- **Auth**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe

## Project Structure

```
ExpertForge/
├── components/          # React components
│   ├── AuthPage.tsx     # Authentication UI
│   ├── CommandCenter.tsx # Main dashboard
│   ├── ExpertCard.tsx   # Persona dossier view
│   ├── LandingPage.tsx  # Marketing landing page
│   ├── TeamChat.tsx     # Multi-agent chat
│   ├── TeamSetup.tsx    # Team configuration
│   └── TeamStructurePreview.tsx  # Org chart visualization
├── lib/                 # Utilities
│   ├── supabase.ts      # Supabase client & auth helpers
│   ├── stripe.ts        # Stripe integration
│   ├── layoutOrgChart.ts # Dagre layout algorithm
│   └── database.types.ts # TypeScript types for Supabase
├── services/            # Business logic
│   ├── geminiService.ts # AI generation with structured schemas
│   └── storageService.ts # Data persistence layer
├── supabase/
│   └── schema.sql       # Database schema
├── types.ts             # TypeScript interfaces
└── App.tsx              # Main app with state machine
```

## Development Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Build for production
npm run preview  # Preview production build
```

## License

MIT
