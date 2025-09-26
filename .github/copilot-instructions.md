# ChosenWorship - AI Coding Assistant Instructions

## Project Overview
ChosenWorship is a church worship setlist management application built with SvelteKit 5, Tailwind CSS 4, and PostgreSQL. Initially designed for single-church use with potential to become a mobile app for Google Play Store.

**Development Phases**: Frontend-first approach → Database implementation → Mobile app conversion

## Architecture & Key Concepts

### Data Model (Worship Domain)
The application revolves around worship team management with these core entities:
- **Users**: Worship team members with instruments, preferred notes, and roles (leader/worship/praise/musical-director)
- **Songs**: Worship songs with original keys, lyrics URLs, and tagging
- **Setlists**: Service arrangements with separate praise/worship sections and leader assignments  
- **Calendar Events**: Scheduled services linked to setlists with time/location
- **User Preferences**: Individual key preferences per song (e.g., user prefers "G" for "Way Maker")
- **Availability**: Team member scheduling constraints

### Current Development Strategy
- **Phase 1**: JSON mock data in `src/lib/data/chosenWorship.json` - focus on UI/UX and frontend logic
- **Phase 2**: PostgreSQL with Drizzle ORM when frontend is stable
- **Phase 3**: Mobile app conversion with Material Design components

## SvelteKit 5 Patterns

### File-Based Routing
- Routes follow SvelteKit conventions: `+page.svelte`, `+layout.svelte`
- Main sections: `/songs`, `/setlists`, `/calendar`, `/profile`
- Use `$lib/` imports for shared components and utilities

### Component Structure  
```svelte
<script lang="ts">
  import data from '$lib/data/chosenWorship.json';
  // Svelte 5 runes for reactivity when needed
</script>
```

## Development Workflow

### Essential Commands
```bash
npm run dev              # Development server
npm run test:unit        # Vitest tests (client + server workspaces)  
npm run check           # TypeScript + Svelte validation
npm run db:studio       # Drizzle database GUI
npm run db:push         # Push schema changes
```

### Testing Setup
- **Client tests**: `*.svelte.test.ts` - Testing Library + jsdom
- **Server tests**: `*.test.ts` - Node environment  
- **Setup**: `vitest-setup-client.ts` includes matchMedia mock for Svelte 5
- **Pattern**: Test component rendering and interactions, not implementation details

### Database Development
- Use `DATABASE_URL` environment variable (see `.env.example`)
- Schema lives in `src/lib/server/db/schema.ts` 
- Database instance: `src/lib/server/db/index.ts`
- Run `npm run db:studio` to inspect data visually

## Project-Specific Conventions

### Worship Domain Vocabulary
- **Praise vs Worship**: Distinct setlist sections with different leaders
- **Keys/Notes**: Critical for musicians - store both original and preferred keys per user
- **Roles**: "leader", "worship", "praise" determine assignment capabilities
- **Instruments**: Array field affects scheduling and key preferences

### Mobile-First Design Approach
- **Target**: Google Play Store submission - design with Material Design 3 principles
- **Responsive**: Mobile-first, touch-friendly interfaces for worship teams on tablets/phones
- **Performance**: Optimize for mobile devices used during live worship services
- **Offline**: Consider offline-first patterns for reliability during services

### Component Patterns
- Import JSON data at component level: `import data from '$lib/data/chosenWorship.json'`
- Transform arrays to lookup objects: `Object.fromEntries(data.users.map(u => [u.id, u]))`
- Use Tailwind for styling with Material Design utilities
- Design components with touch targets and mobile gestures in mind

### State Management
- Phase 1: JSON imports with Svelte 5 runes (`$state`, `$derived`) for interactivity
- Phase 2: SvelteKit load functions + form actions for server state
- Consider PWA patterns for mobile app conversion

## Key Implementation Notes

### Musical Key Handling & Transposition
Users have `defaultPreferredNote` but can override per song via `userSongPreferences`. Always check for song-specific preferences first.

**Transposition Logic** (Priority for musical-director role):
- Calculate semitone differences between original and preferred keys
- Standard chromatic scale: C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B
- Display transposed keys for all instruments when musical-director views setlists
- Consider capo suggestions for guitarists (e.g., Capo 2 to play G shapes for A)

### Role-Based Features
Check user `roles` array for permissions:
- "leader": Can create setlists and assign others
- "worship"/"praise": Can be assigned to lead those sections  
- "musical-director": Has advanced transposition tools and full team key overview

### Database Migration Strategy
Current schema only has basic `user` table. When implementing features:
1. Expand schema to match JSON structure
2. Create migration scripts  
3. Seed with existing JSON data
4. Replace JSON imports with database queries

### Testing Worship Logic
Focus on domain logic tests:
- Key transposition calculations (semitone math, capo suggestions)
- Role assignment validation (especially musical-director permissions)
- Setlist ordering and conflicts
- Availability checking algorithms
- Mobile UI interactions and touch responsiveness