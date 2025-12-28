# Video Script Writer Pro

## Overview

Video Script Writer Pro is a professional short-form video script generation tool designed for content creators. The application helps users create viral-worthy scripts by combining customizable categories, hook formats, structures, tones, and voices. It includes a Hemingway-style readability analyzer to ensure scripts are punchy, clear, and grade 4-6 reading level for maximum engagement.

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
- **OpenAI Integration**: Uses gpt-4o-mini via Replit AI Integrations (no API key needed, charges to user's Replit credits)
- **Deep Research Mode**: Two-phase AI approach - first researches topic (stats, expert quotes, contrarian takes), then generates script with enhanced context
- **Word Count Targets**: Platform/duration specific (15s: 30-45, 30s: 60-90, 60s: 120-180, 90s: 180-270, 180s: 360-540 words)
- **Fallback**: Automatically falls back to template-based generation if AI fails

### Key Design Decisions

**Shared Schema Pattern**: Schema definitions live in `shared/` directory, imported by both frontend and backend. This ensures type safety across the stack.

**Memory-First Storage**: The `IStorage` interface with `MemStorage` implementation allows rapid development. PostgreSQL integration is configured via Drizzle ORM but storage currently uses in-memory maps.

**Dark Theme Default**: The application uses a dark color scheme optimized for content creators who often work in low-light environments.

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