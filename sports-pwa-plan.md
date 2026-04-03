# Sports PWA — Claude Code Implementation Plan

You are building a Progressive Web App (PWA) sports score and match tracker. Follow this plan **phase by phase, step by step**. Complete each step fully before moving to the next. Do not skip steps. Do not deviate from the specified stack without asking.

---

## Stack Reference (do not change)

- **Framework:** TanStack Start (full-stack React, file-based routing, SSR)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Language:** TypeScript throughout
- **Auth:** Better Auth (session-based, no JWT)
- **ORM:** Drizzle ORM
- **DB:** SQLite locally, Turso-ready schema
- **Server state:** TanStack Query (polling, caching)
- **PWA:** vite-plugin-pwa
- **Validation:** Zod
- **Build:** Vite (via TanStack Start)

---

## PHASE 1 — Project Scaffolding & Core Config

### Step 1.1: Scaffold TanStack Start

```bash
mkdir sports-pwa && cd sports-pwa
npm create @tanstack/start@latest . -- --template minimal
```

If the interactive scaffold fails or the template flag isn't supported, manually init:
- `npm init -y`
- Install core deps: `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`, `react`, `react-dom`, `vite`, `typescript`
- Create `tsconfig.json` with strict mode, JSX react-jsx, paths alias `@/*` → `./app/*`
- Create `vite.config.ts` importing TanStack Start's Vite plugin
- Create `app/router.tsx`, `app/client.tsx`, `app/ssr.tsx` per TanStack Start docs

Verify: `npm run dev` starts without errors.

### Step 1.2: Install Tailwind CSS v4

```bash
npm install tailwindcss @tailwindcss/vite
```

- Add the Tailwind Vite plugin to `vite.config.ts`
- Create `app/styles/globals.css` with `@import "tailwindcss";`
- Import `globals.css` in the root layout
- Define CSS custom properties for the design system (see Phase 8 for exact values)

Verify: A `<div className="text-red-500">test</div>` renders red text.

### Step 1.3: Install and configure shadcn/ui

```bash
npx shadcn@latest init
```

Configure for:
- Style: default
- CSS variables: yes
- Tailwind config path: match your setup
- Components alias: `@/components/ui`
- Utils alias: `@/lib/utils`

Create `app/lib/utils.ts` with the `cn()` helper (clsx + tailwind-merge).

Install initial components you'll need:
```bash
npx shadcn@latest add button card input label tabs form toast avatar dropdown-menu dialog select switch badge separator
```

Verify: Render a `<Button>` from shadcn — it should be styled correctly.

### Step 1.4: Environment variables

Create `.env.local`:
```
VITE_FOOTBALL_API_KEY=
VITE_NBA_API_KEY=
BETTER_AUTH_SECRET=REPLACE_WITH_RANDOM_32_CHAR_STRING
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=./sports-pwa.db
```

Create `.env.example` with the same keys but blank values. Add `.env.local` to `.gitignore`.

---

## PHASE 2 — Database & ORM

### Step 2.1: Install Drizzle

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

### Step 2.2: Define schema

Create `db/schema.ts` with these tables:

```typescript
// users — id (text, primary key, uuid), email (text, unique, not null), 
//          passwordHash (text, not null), createdAt (integer, default now)

// sessions — id (text, primary key), userId (text, FK → users.id), 
//             expiresAt (integer, not null)

// preferences — id (text, primary key, uuid), userId (text, FK → users.id, unique),
//                defaultSport (text, default 'football'), theme (text, default 'dark')

// followed_teams — id (text, primary key, uuid), userId (text, FK → users.id),
//                   sport (text, not null), teamId (text, not null), 
//                   teamName (text, not null), teamCrest (text)
//                   UNIQUE constraint on (userId, sport, teamId)

// notification_settings — id (text, primary key, uuid), userId (text, FK → users.id, unique),
//                          preGame (integer/boolean, default 1), 
//                          goingLive (integer/boolean, default 1),
//                          scoreUpdate (integer/boolean, default 1)
```

Use `sqliteTable` from `drizzle-orm/sqlite-core`. Use `text` for IDs (generate UUIDs in app code). Use `integer` for booleans (SQLite convention). Add proper foreign key references.

### Step 2.3: DB client

Create `db/index.ts`:
- Import `better-sqlite3` and `drizzle`
- Read `DATABASE_URL` from env
- Export the `db` instance

### Step 2.4: Drizzle config

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: { url: process.env.DATABASE_URL || './sports-pwa.db' },
});
```

Add scripts to `package.json`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

Run `npm run db:generate` then `npm run db:migrate`. Verify the `.db` file is created.

---

## PHASE 3 — Authentication

### Step 3.1: Install Better Auth

```bash
npm install better-auth
```

### Step 3.2: Configure Better Auth

Create `app/lib/auth.ts`:
- Import `betterAuth` from `better-auth`
- Configure with:
  - `database`: point to the Drizzle/SQLite instance (use Better Auth's Drizzle adapter or direct SQLite adapter)
  - `emailAndPassword`: `{ enabled: true }`
  - `session`: configure session storage to use the `sessions` table
  - `secret`: read from `BETTER_AUTH_SECRET` env var
  - `baseURL`: read from `BETTER_AUTH_URL` env var

**Important**: Better Auth can auto-create its own user/session tables, OR you can point it at your Drizzle schema. Check Better Auth docs for the Drizzle adapter pattern. If Better Auth wants to manage its own user table, adapt your schema to match or use Better Auth's schema generation CLI.

### Step 3.3: Auth API route

Create the Better Auth API handler as a TanStack Start server function or API route at `/api/auth/[...all]`. This catch-all route delegates to Better Auth's handler.

### Step 3.4: Auth client

Create `app/lib/auth-client.ts`:
- Import `createAuthClient` from `better-auth/client`
- Export the client configured with `baseURL`
- This provides `signIn`, `signUp`, `signOut`, `useSession` hooks

### Step 3.5: Auth context & protected routes

Create a helper/wrapper that:
1. Checks session on the server side (TanStack Start loader)
2. If no session → redirect to `/login`
3. If session exists → pass user data to child routes via context

Apply this to ALL `/dashboard/*` routes.

---

## PHASE 4 — Auth Pages (Login / Register)

### Step 4.1: Login page (`app/routes/login.tsx`)

- Full-page layout, centered card on dark background
- shadcn `Card` containing a `Form` with email + password `Input` fields
- "Sign In" `Button` — calls `authClient.signIn.email()`
- Link to `/register` below the form
- On success → redirect to `/dashboard` (or `/onboarding` if first login — check if preferences exist)
- Show error toasts on failure via shadcn `Toast`
- **Design**: Dark background (#0a0a0a), sport-themed accent on the button, the app logo/name "SCOREKEEPER" or similar in a bold display font at the top

### Step 4.2: Register page (`app/routes/register.tsx`)

- Same layout as login
- Email + password + confirm password fields
- Zod validation schema: email format, password min 8 chars, passwords match
- On submit → `authClient.signUp.email()`
- On success → create default `preferences` and `notification_settings` rows for the user (via server function), then redirect to `/onboarding`
- Link back to `/login`

### Step 4.3: Index route (`app/routes/index.tsx`)

- If authenticated → redirect to `/dashboard`
- If not → redirect to `/login`

---

## PHASE 5 — PWA Setup

### Step 5.1: Install vite-plugin-pwa

```bash
npm install vite-plugin-pwa -D
```

### Step 5.2: Configure in vite.config.ts

Add `VitePWA` plugin with:
- `registerType: 'autoUpdate'`
- `manifest`: name, short_name, description, theme_color (#0a0a0a), background_color (#0a0a0a), display: 'standalone', icons (generate 192x192 and 512x512 PNG icons — can be simple text-based SVG converted to PNG, or placeholder solid-color icons for now)
- `workbox`: configure runtime caching strategies — CacheFirst for static assets, NetworkFirst for API calls

### Step 5.3: Create manifest.json in /public

Even though vite-plugin-pwa generates one, have a base `manifest.json` with:
```json
{
  "name": "Sports Tracker",
  "short_name": "Scores",
  "start_url": "/dashboard",
  "display": "standalone",
  "theme_color": "#0a0a0a",
  "background_color": "#0a0a0a",
  "icons": [...]
}
```

### Step 5.4: PWA install prompt component

Create `app/components/pwa-install-prompt.tsx`:
- Listen for the `beforeinstallprompt` event
- Show a dismissable banner/toast suggesting installation
- Store dismissal in localStorage so it doesn't nag

Verify: In Chrome DevTools → Application tab, the manifest loads and service worker registers.

---

## PHASE 6 — App Shell & Routing

### Step 6.1: Root layout (`app/routes/__root.tsx`)

- Wrap in TanStack Query provider (`QueryClientProvider`)
- Apply dark theme class to `<html>` element by default
- Load the display font (Rajdhani or Barlow Condensed) via `<link>` to Google Fonts or Fontsource
- Include global CSS
- Add `<Toaster />` from shadcn
- Meta tags for PWA (theme-color, viewport, apple-mobile-web-app-capable)

### Step 6.2: Dashboard layout (`app/routes/dashboard/index.tsx`)

This is the main app shell. Structure:

```
┌──────────────────────────────┐
│  HEADER: App name + avatar   │
│  dropdown (settings, logout) │
├──────────────────────────────┤
│  SPORT TABS (horizontal):   │
│  ⚽ Football │ 🏈 AFL │      │
│  🏀 NBA │ 🎾 Tennis          │
├──────────────────────────────┤
│                              │
│  TAB CONTENT:                │
│  - Today's matches           │
│  - Live scores (highlighted) │
│  - Standings snippet         │
│                              │
└──────────────────────────────┘
│  MOBILE BOTTOM NAV (optional)│
└──────────────────────────────┘
```

- Use shadcn `Tabs` for sport switching
- Default tab = user's `defaultSport` preference from DB (loaded in route loader)
- Each tab renders a `<SportTab sport="football" />` component
- Header: app name in display font, user avatar/initial with `DropdownMenu` (Settings, Sign Out)

### Step 6.3: Sport accent colour system

Define CSS variables that change per active sport tab:

```css
/* Football */  --sport-accent: #22c55e; --sport-accent-dim: #166534;
/* AFL */       --sport-accent: #eab308; --sport-accent-dim: #a16207;
/* NBA */       --sport-accent: #f97316; --sport-accent-dim: #c2410c;
/* Tennis */    --sport-accent: #84cc16; --sport-accent-dim: #4d7c0f;
```

Toggle these on the dashboard container when tabs switch (via a data attribute or class). All accent-coloured elements (borders, highlights, badges) use `var(--sport-accent)`.

### Step 6.4: Dark theme tokens

In `globals.css`, define the full dark palette:

```css
:root {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #141414;
  --card-foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a1a1aa;
  --border: #262626;
  --ring: var(--sport-accent);
  --radius: 0.5rem;
}
```

Override shadcn's default CSS variables with these.

---

## PHASE 7 — API Modules

Each API module lives in `app/api/` and exports typed fetch functions. Every function returns a normalized shape. Use Zod to validate API responses.

### Step 7.1: Shared types

Create `app/api/types.ts`:

```typescript
export interface Match {
  id: string;
  sport: 'football' | 'afl' | 'nba' | 'tennis';
  homeTeam: { id: string; name: string; crest?: string; score: number | null };
  awayTeam: { id: string; name: string; crest?: string; score: number | null };
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  startTime: string; // ISO
  competition: string;
  venue?: string;
  events?: MatchEvent[];
}

export interface MatchEvent {
  minute?: number;
  type: string; // 'goal', 'card', 'substitution', etc.
  team: string;
  player?: string;
  detail?: string;
}

export interface Standing {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn?: number;
  lost: number;
  points?: number;
  // sport-specific fields as needed
}
```

### Step 7.2: Football module (`app/api/football.ts`)

- Base URL: `https://api.football-data.org/v4`
- Auth header: `X-Auth-Token: ${VITE_FOOTBALL_API_KEY}`
- Functions:
  - `getTodaysMatches()` — `GET /matches?dateFrom=TODAY&dateTo=TODAY` → normalize to `Match[]`
  - `getMatchDetail(id)` — `GET /matches/{id}` → `Match` with events
  - `getStandings(competitionCode)` — `GET /competitions/{code}/standings` → `Standing[]`
  - `searchTeams(query)` — `GET /teams?name={query}` → for team search in onboarding
- Default competition: Premier League (`PL`). Also support: La Liga (`PD`), Bundesliga (`BL1`), Serie A (`SA`), Champions League (`CL`)
- Handle rate limit (10 req/min) — if 429, return cached data or show "rate limited" message
- **Important**: These fetches must happen server-side (TanStack Start server functions) to protect API keys. Expose them via server functions that the client calls through TanStack Query.

### Step 7.3: AFL module (`app/api/afl.ts`)

- Base URL: `https://api.squiggle.com.au`
- No auth needed
- Functions:
  - `getTodaysMatches()` — `GET /?q=games;year=CURRENT_YEAR;round=CURRENT_ROUND` → normalize to `Match[]`
  - `getMatchDetail(id)` — `GET /?q=games;game={id}` → `Match`
  - `getStandings()` — `GET /?q=standings;year=CURRENT_YEAR` → `Standing[]`
  - `searchTeams(query)` — `GET /?q=teams` → filter client-side (only 18 teams)
- Squiggle API returns flat JSON. Map fields: `hteam`→home, `ateam`→away, `hscore`/`ascore`→scores, `is_final`→status

### Step 7.4: NBA module (`app/api/nba.ts`)

- Base URL: `https://api.balldontlie.io/v1`
- Auth: `Authorization: ${VITE_NBA_API_KEY}` (if required by current free tier) or query param
- Functions:
  - `getTodaysMatches()` — `GET /games?dates[]={today}` → normalize to `Match[]`
  - `getMatchDetail(id)` — `GET /games/{id}` + `GET /stats?game_ids[]={id}` for box score
  - `getStandings()` — `GET /teams` + derive from season records, or compute from games
  - `searchTeams(query)` — `GET /teams?search={query}`
- Map fields: `home_team`→home, `visitor_team`→away, `home_team_score`/`visitor_team_score`→scores, `status`→map to our status enum

### Step 7.5: Tennis module (`app/api/tennis.ts`)

- Base URL: `https://www.thesportsdb.com/api/v1/json/3` (free key = `3`)
- Functions:
  - `getTodaysMatches()` — `GET /eventsday.php?d={YYYY-MM-DD}&s=Tennis` → normalize
  - `getMatchDetail(id)` — `GET /lookupevent.php?id={id}`
  - `getStandings()` — Tennis doesn't have traditional standings; show recent results or rankings if available
  - `searchTeams(query)` — `GET /searchplayers.php?p={query}&s=Tennis` (tennis uses players, not teams — adapt the followed_teams concept to followed players)
- Note: For tennis, "teams" = individual players. The UI should say "Followed Players" on the Tennis tab.

### Step 7.6: Server functions wrapper

Create `app/api/server.ts` (or colocate with each module):
- Wrap each API function in a TanStack Start `createServerFn`
- These run server-side, keeping API keys secure
- Client calls these via TanStack Query

---

## PHASE 8 — TanStack Query Hooks

### Step 8.1: Query client config

In the root layout or a dedicated provider file:
- Create `QueryClient` with defaults: `staleTime: 60_000` (1 min), `refetchOnWindowFocus: true`

### Step 8.2: `app/hooks/use-live-scores.ts`

```typescript
export function useLiveScores(sport: Sport) {
  return useQuery({
    queryKey: ['scores', sport, 'today'],
    queryFn: () => getMatchesBySport(sport), // calls the appropriate server function
    refetchInterval: 60_000, // poll every 60s
    refetchIntervalInBackground: true, // keep polling when tab is backgrounded
  });
}
```

### Step 8.3: `app/hooks/use-followed-teams.ts`

```typescript
export function useFollowedTeams(sport?: Sport) {
  return useQuery({
    queryKey: ['followedTeams', sport],
    queryFn: () => getFollowedTeamsServerFn({ sport }), // server function reading from DB
  });
}

export function useToggleFollowTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (team: { sport, teamId, teamName, teamCrest }) => 
      toggleFollowTeamServerFn(team),
    onMutate: async (team) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['followedTeams'] });
      // ... optimistic add/remove logic
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['followedTeams'] }),
  });
}
```

### Step 8.4: `app/hooks/use-match-detail.ts`

```typescript
export function useMatchDetail(sport: Sport, matchId: string) {
  return useQuery({
    queryKey: ['match', sport, matchId],
    queryFn: () => getMatchDetailBySport(sport, matchId),
    refetchInterval: (query) => {
      // Only poll if match is live
      return query.state.data?.status === 'live' ? 30_000 : false;
    },
  });
}
```

---

## PHASE 9 — UI Components

### Step 9.1: `app/components/scorecard.tsx`

A card showing one match. Design:

```
┌─────────────────────────────────┐
│  Competition Name      12:30 PM │
├─────────────────────────────────┤
│  🏠 Home Team          2        │
│  ✈️  Away Team          1        │
│                          LIVE 🔴│
└─────────────────────────────────┘
```

- Use shadcn `Card`
- Score numbers in the bold display font, large (text-3xl+)
- If status = live, show a pulsing red dot (CSS animation) and `LIVE` badge with `var(--sport-accent)` background
- If status = scheduled, show kickoff time
- If status = finished, show `FT` badge
- Team crests as small images (or initials fallback in a colored circle)
- Clicking navigates to `/dashboard/match/{id}`
- If the match involves a followed team, show a subtle star icon or accent border

### Step 9.2: `app/components/standings.tsx`

A compact table. Show top 5–8 teams by default with "Show all" expansion.

```
┌───┬────────────────┬────┬────┬───┐
│ # │ Team           │ P  │ W  │Pts│
├───┼────────────────┼────┼────┼───┤
│ 1 │ Arsenal        │ 30 │ 22 │ 72│
│ 2 │ Liverpool      │ 30 │ 21 │ 70│
└───┴────────────────┴────┴────┴───┘
```

- Highlight followed teams with accent color row background
- Use shadcn `Table` or a custom styled table
- Tennis: show "Recent Results" list instead of standings

### Step 9.3: `app/components/sport-tab.tsx`

The content rendered inside each tab. Layout:

1. **"Your Matches"** section (if user follows teams in this sport) — filtered matches involving followed teams, shown first with emphasis
2. **"Today's Matches"** section — all today's matches as scorecards in a responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
3. **"Standings"** section — compact standings table

If no matches today, show a "No matches today" empty state with the sport icon.

Loading state: use skeleton cards (shadcn `Skeleton`).

### Step 9.4: `app/components/match-detail.tsx`

Full match detail view for `app/routes/dashboard/match.$id.tsx`.

Layout:
```
┌──────────────────────────────────┐
│  ← Back          Competition     │
├──────────────────────────────────┤
│                                  │
│   Home Team    2 — 1   Away Team │
│   [crest]              [crest]   │
│                                  │
│           LIVE 67'  🔴           │
├──────────────────────────────────┤
│  MATCH EVENTS:                   │
│  ⚽ 23' — Player A (Home)       │
│  🟨 35' — Player B (Away)       │
│  ⚽ 51' — Player C (Home)       │
│  ⚽ 68' — Player D (Away)       │
├──────────────────────────────────┤
│  MATCH INFO:                     │
│  Venue: Stadium Name             │
│  Kickoff: 20:00                  │
└──────────────────────────────────┘
```

- Score in extra-large display font
- Events timeline as a vertical list with minute markers
- If live, auto-poll every 30s (see hook)
- Flash animation on score change: briefly flash `var(--sport-accent)` on the score that changed

### Step 9.5: `app/components/team-search.tsx`

Used in onboarding and settings. A searchable list of teams per sport.

- Text input with debounced search (300ms)
- Results as a scrollable list of team cards with crest, name, and a follow/unfollow toggle button
- Already-followed teams show as "Following" with a checkmark
- Use the `searchTeams` server function for each sport API
- For Tennis, label as "Search Players"

### Step 9.6: `app/components/notification-toggle.tsx`

Three toggle switches in a card:
- "Pre-game alerts (15 min before)" — `preGame`
- "Going live alerts" — `goingLive`  
- "Score change alerts" — `scoreUpdate`

Each toggle calls a server function mutation to update `notification_settings`. Use optimistic updates.

---

## PHASE 10 — Match Detail Route

### Step 10.1: `app/routes/dashboard/match.$id.tsx`

- Route param: `$id` (match ID)
- Also need to know the sport — either encode in the URL (`/dashboard/match/$sport/$id`) or pass as a search param (`?sport=football`)
- **Recommended**: Change route to `match.$sport.$id.tsx` for clean URLs like `/dashboard/match/football/12345`
- Route loader: fetch match detail server-side for SSR
- Client: use `useMatchDetail` hook with polling
- Render `<MatchDetail />` component
- Back button returns to dashboard with the correct sport tab active

---

## PHASE 11 — Onboarding

### Step 11.1: `app/routes/onboarding.tsx`

Multi-step flow (can be a single page with sections, or a step wizard):

1. **Welcome screen** — "Let's set up your tracker" + brief explanation
2. **Select teams per sport** — 4 sections, each with `<TeamSearch>` for that sport. User can skip any sport.
3. **Notification permissions** — Ask to enable notifications, show the 3 toggles. User can skip.
4. **Done** — "You're all set!" → redirect to `/dashboard`

- Persist all selections via server functions as the user progresses (or batch at the end)
- Set a flag (in preferences or a column) that onboarding is complete, so they aren't re-prompted
- **Design**: Full-screen dark background, centered content, sport accent colors used as progress indicators

---

## PHASE 12 — Settings

### Step 12.1: `app/routes/dashboard/settings.tsx`

Sections:
1. **Default Sport** — select dropdown (football / AFL / NBA / tennis)
2. **Theme** — dark/light toggle (dark default). Changing this updates the CSS class on `<html>` AND persists to DB.
3. **Followed Teams** — one expandable section per sport with `<TeamSearch>` showing currently followed teams with unfollow buttons
4. **Notifications** — `<NotificationToggle>` component
5. **Account** — show email, "Sign Out" button

All changes persist immediately via mutations (optimistic UI + server sync).

---

## PHASE 13 — Preferences Server Functions

### Step 13.1: Server functions for CRUD

Create these TanStack Start server functions (using `createServerFn`):

```
getPreferences(userId)           → preferences row
updatePreferences(userId, data)  → update defaultSport, theme

getFollowedTeams(userId, sport?) → followed_teams rows
addFollowedTeam(userId, team)    → insert into followed_teams
removeFollowedTeam(userId, teamId, sport) → delete from followed_teams

getNotificationSettings(userId)  → notification_settings row
updateNotificationSettings(userId, data) → update toggles
```

Each function:
1. Validates input with Zod
2. Checks that the session is valid (auth guard)
3. Performs DB operation via Drizzle
4. Returns the updated data

---

## PHASE 14 — Notifications

### Step 14.1: `app/hooks/use-notifications.ts`

- `requestNotificationPermission()` — calls `Notification.requestPermission()`
- `sendNotification(title, body, data)` — creates a `Notification` or posts to service worker
- Track permission state in React state

### Step 14.2: Notification trigger logic

In the live scores polling hook, after each refetch:
1. Compare new data with previous data (use `useRef` to store previous scores)
2. For each match involving a followed team:
   - If match status changed to `live` AND `goingLive` is enabled → notify "Match starting: Home vs Away"
   - If score changed AND `scoreUpdate` is enabled → notify "Goal! Home 2-1 Away"
3. For pre-game (15 min before): check scheduled matches involving followed teams. If `startTime` is within 15 min and `preGame` is enabled → notify "Starting soon: Home vs Away"

### Step 14.3: Service worker notification handling

In the service worker (`public/sw.js` or via workbox config):
- Listen for `notificationclick` event
- Extract match URL from notification data
- Open/focus the app window and navigate to the match detail view (deep link)

### Step 14.4: Notification data shape

```typescript
{
  title: "Goal! Arsenal 2-1 Chelsea",
  body: "Saka scores in the 67th minute",
  data: { url: "/dashboard/match/football/12345" },
  icon: "/icons/icon-192.png",
  badge: "/icons/badge-72.png"
}
```

---

## PHASE 15 — Offline Support

### Step 15.1: Service worker caching strategy

Configure workbox (via vite-plugin-pwa) with:

- **Precache**: App shell (HTML, CSS, JS bundles, fonts, icons)
- **Runtime cache — API calls**: NetworkFirst strategy with 5-minute TTL. If offline, serve from cache.
- **Runtime cache — Images (team crests)**: CacheFirst with 7-day TTL
- **Cache name prefix**: `sports-pwa-`

### Step 15.2: Offline indicator

Create a component that:
- Listens to `navigator.onLine` and `online`/`offline` events
- Shows a subtle banner at the top: "You're offline — showing cached data" when offline
- Hides automatically when back online

---

## PHASE 16 — Animations & Polish

### Step 16.1: Score update flash

When a score changes in the scorecard:
- Briefly flash the score number with the sport accent color background
- Use Tailwind `animate-pulse` or a custom keyframe:
```css
@keyframes score-flash {
  0%, 100% { background: transparent; }
  50% { background: var(--sport-accent); color: var(--background); }
}
```
- Trigger via a `key` change or a state flag

### Step 16.2: Tab transitions

- Smooth content transitions when switching sport tabs
- Use CSS transitions on opacity/transform, or TanStack Router's built-in transition support

### Step 16.3: Loading skeletons

Every data-loading state should show skeleton placeholders:
- Scorecard skeleton: grey rounded rectangles mimicking the card layout
- Standings skeleton: table row placeholders
- Match detail skeleton: large score placeholder + event list placeholders

### Step 16.4: Empty states

Design thoughtful empty states:
- "No matches today" — sport icon + message
- "No followed teams" — prompt to add teams with a CTA button
- "No events" in match detail — "No events recorded yet"

### Step 16.5: PWA install banner

Show a tasteful install prompt banner at the bottom of the dashboard:
- "Install Sports Tracker for the best experience"
- "Install" button + "Dismiss" X
- Only show once, remember dismissal

---

## PHASE 17 — Final Verification Checklist

Run through each of these before considering the project complete:

- [ ] `npm run dev` starts without errors
- [ ] Register a new account → redirected to onboarding
- [ ] Complete onboarding → lands on dashboard with followed teams highlighted
- [ ] All 4 sport tabs load and show data (or graceful empty/error states if no API keys)
- [ ] Clicking a match → match detail view loads with events
- [ ] Settings page: can change default sport, theme, followed teams, notification toggles
- [ ] Sign out → redirected to login
- [ ] Sign in again → dashboard with saved preferences
- [ ] Dark/light theme toggle works and persists
- [ ] PWA: manifest loads in DevTools, service worker registers
- [ ] PWA: app is installable (install prompt appears)
- [ ] Offline: turn off network → app shows cached data with offline banner
- [ ] Mobile viewport: layout is responsive, no horizontal scroll
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console errors in browser

---

## Design Reference

**Fonts:**
- Headings/Scores: Rajdhani (700 weight) or Barlow Condensed (600/700)
- Body: system sans-serif stack or a clean sans like "DM Sans"

**Color palette:**
```
Background:        #0a0a0a
Card:              #141414
Card hover:        #1a1a1a
Border:            #262626
Text primary:      #fafafa
Text secondary:    #a1a1aa
Football accent:   #22c55e
AFL accent:        #eab308
NBA accent:        #f97316
Tennis accent:     #84cc16
Error:             #ef4444
Success:           #22c55e
```

**Scoreboard aesthetic notes:**
- Think stadium jumbotron: dark backgrounds, high-contrast scores, vivid accent pops
- Scores should feel BIG and important — large font, prominent placement
- Live indicators should pulse/animate subtly
- Team crests add visual identity — always show them when available
- Cards should have subtle borders, not drop shadows
- The overall feel: a premium sports data app, not a generic dashboard

---

## Important Notes for Claude Code

1. **Do not hallucinate API responses.** If you're unsure about an API's exact response format, add a TODO comment and use a reasonable type. I'll verify against the real API.
2. **Server functions for all API calls.** Never expose API keys to the client. All external API calls go through TanStack Start server functions.
3. **Handle API errors gracefully.** Every API call should have try/catch with user-friendly error states. Never show raw error messages.
4. **Use real shadcn components.** Install them via the CLI, don't manually create them.
5. **Test each phase.** After completing each phase, verify it works before moving on. Don't build on broken foundations.
6. **Git commit after each phase.** Logical, atomic commits.
7. **Ask me before deviating** from this spec — especially around auth flow, database schema, or API choices.
