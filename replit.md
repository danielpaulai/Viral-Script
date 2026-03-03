# Viral Script Writer

## Overview

Viral Script Writer is a professional short-form video content tool designed for content creators. The core value proposition is converting raw ideas into viral-ready video scripts through a clarity-first Content Skeleton process (Problem → Core Teaching → Hook → CTA). Clear ideas create viral content.

### Viral Script Wizard
The app now features a purpose-driven video planning process:

**Step 0: Video Purpose Selection**
Users first choose their video's primary purpose:
- **Authority**: Bold opinions and unique perspectives that position you as a thought leader
- **Education**: Teachable frameworks and actionable methods viewers can implement
- **Storytelling**: Personal experiences with lessons that create emotional connection

Each purpose dynamically adjusts guiding questions throughout the wizard.

**Steps 1-4: Content Skeleton (Problem → Core Teaching → Hook → CTA)**
1. **Problem**: Define the specific pain point your audience relates to
2. **Core Teaching**: The single "golden nugget" insight - the real value of your video (not a one-liner, but the complete teaching)
3. **Hook**: AI-generated conversational hooks that sound spoken, not like headlines
4. **CTA**: What action you want viewers to take

Each section is validated to prevent vague language patterns. A clarity score must reach 70% before script generation unlocks. The final script spends 60-70% of its body elaborating on the Core Teaching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Build Tool**: Vite with React plugin

The frontend follows a page-based structure with reusable components. Pages include Home (script creation), Projects, Calendar, and Vault for saved scripts.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Storage**: In-memory storage class implementing `IStorage` interface (designed for easy database swap)
- **Schema Validation**: Zod with drizzle-zod integration

The backend uses a clean separation between routes, storage, and schema definitions. The storage interface allows swapping between memory storage and PostgreSQL.

### Data Model
Core entities defined in `shared/schema.ts`:
- **Scripts**: Generated video scripts with parameters and content
- **Projects**: Script organization containers
- **VaultItems**: Saved/bookmarked scripts
- **Users**: Basic user model for future auth

Script generation uses predefined catalogs:
- 9 script categories (content creation, business, AI, personal branding, etc.)
- 50 viral hooks organized in 7 categories (personal experience, case study, secret reveal, contrarian, question, list, education)
- 6 structure formats (problem solver, breakdown, listicle, tutorial, etc.)
- 5 tone options and voice options
- Duration and platform targeting
- **CTA Library**: 30+ predefined CTAs across 6 categories (Follow, Engage, Save, Link, Action, Community)

### AI-Powered Script Generation
- **OpenAI Integration**: Uses direct OpenAI API (`https://api.openai.com/v1`) with `OPENAI_API_KEY` environment variable
- **Centralized AI Config**: All OpenAI clients use the same configuration - direct OpenAI API for both development and production
- **Deep Research Mode**: Two-phase AI approach - first researches topic (stats, expert quotes, contrarian takes), then generates script with enhanced context
- **Viral Examples Feature** (Pro/Ultimate only): Fetches real viral TikTok captions for inspiration, including engagement metrics, format detection, and hook type analysis
- **Word Count Targets**: Platform/duration specific at ~2.7-3.3 words/sec speaking rate (15s: 38-50, 30s: 80-100, 60s: 160-200, 90s: 240-300, 180s: 480-600 words)
- **Fallback**: Automatically falls back to template-based generation if AI fails

### Clone Video Format Feature
- **Video Analysis**: Uses GPT-4o to analyze viral videos and extract full "Video DNA" — sections, hookAnalysis, emotionalArc, retentionMechanics, toneProfile, sentenceStructure, transitionPhrases, powerWords, ctaAnalysis
- **Clone Script Generation**: Uses GPT-4o (upgraded from gpt-4o-mini) with 3000 max_tokens for higher fidelity structural cloning
- **Clone-Specific Quality Rules**: Clone mode uses its own quality criteria (structural fidelity, voice match, rhythm match, hook psychology, transition fidelity, emotional arc) instead of generic rules (grade level, fluff detection, specificity)
- **Separate Retry Logic**: Clone mode only retries for word count, CTA, and topic relevance — skips grade level, fluff, actionability, and specificity checks that would conflict with the cloned video's style
- **Coherence Validation Bypass**: Clone scripts skip the generic "hook → problem → solution → CTA" coherence check since cloned structures have their own custom flow
- **Section Display**: Frontend uses `parseClonedSections()` to render each section with color-coded headers, copy buttons, and matching original section metadata (purpose, emotional tone, duration percentage)

### Apify Social Media Integration
- **TikTok Viral Examples API**: `/api/viral-examples` fetches top viral TikTok captions by topic
- **Instagram Viral Examples API**: `/api/viral-examples/instagram` fetches top Instagram Reels/posts by hashtag
- **Full Caption Extraction**: Pulls complete captions, duration patterns, engagement breakdown
- **Format & Hook Detection**: Automatically categorizes content by format type (listicle, story, tutorial, etc.) and hook type (question, statistic, contrarian, etc.)
- **Aggregate Analytics**: Calculates avgViews, avgEngagement, dominantFormats, bestPerformingDuration
- **Skeleton Enhancement**: Viral examples data is fed into the AI prompt to improve content skeleton quality

### Admin Analytics Dashboard
- **Admin Dashboard Page**: `/admin` - Shows platform usage and user statistics
- **API Endpoint**: `GET /api/admin/analytics` (requires authentication)
- **Metrics Tracked**:
  - Total users, new signups (today/week/month)
  - Scripts generated and active creators
  - Subscription breakdown (trial/starter/pro/ultimate)
  - Recent users list with tier information
  - Most active users by script count
  - Daily signup trends (30-day chart)
  - Content analytics (categories, platforms, durations, tones)
  - User retention (returning users, power users, activation rates)
  - Hourly activity patterns and weekly cohorts
- **Charts**: Uses Recharts for AreaChart (signups), PieChart (subscriptions), BarChart (content)
- **Supabase Sync**: Admin-only button to sync Supabase Auth users to local DB for complete analytics
- **Access Control**: Analytics visible to all authenticated users; sync restricted to admin plan

### Pricing Model
- **Completely Free**: All features are free with no limits, no trial, no subscription required
- **No Paywalls**: All server-side plan checks and trial limits have been removed
- **Stripe Integration**: Still configured but not actively used for billing (webhook/billing endpoints remain for legacy compatibility)

### Hybrid Authentication System
- **Supabase Auth**: Primary authentication provider for user registration and login
- **Local Database**: Stores user records and usage data
- **User Sync**: When Supabase users log in, local records are created/updated with `supabase_user_id` link
- **Shadow Users**: Admin can manually sync Supabase users who haven't logged in yet via `/api/admin/sync-supabase-users`

### Key Design Decisions

**Shared Schema Pattern**: Schema definitions live in `shared/` directory, imported by both frontend and backend. This ensures type safety across the stack.

**Database-First Storage**: The app now uses PostgreSQL for all data persistence with memory cache synchronization for performance. All CRUD operations query the database first, then update the memory cache.

**Light/Dark Theme Toggle**: The application supports both light and dark themes with a toggle in the header. Dark theme is the default, optimized for content creators who often work in low-light environments. Theme preference is persisted in localStorage.

## External Dependencies

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and migrations (`drizzle-kit push`)
- Migrations output to `./migrations` directory

### Frontend Libraries
- **@tanstack/react-query**: Async state management
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **date-fns**: Date manipulation

### Development Tools
- **Vite**: Development server with HMR
- **tsx**: TypeScript execution for server
- **esbuild**: Production bundling

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development environment indicator