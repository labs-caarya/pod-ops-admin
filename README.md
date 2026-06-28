# Pod Operating Portal v6

A Caarya **pod operating portal** — a React workspace where a student-led pod runs its real operations: researching startups & brands, running outreach, mapping & placing talent, sharing opportunities, and growing academic + industry partnerships.

Dark **ruby & amber** theme on a subtle India backdrop. UI/structure carried over from `pod-ops-live`, re-themed for dark mode.

## Features

| Area | What it does |
|------|--------------|
| **Dashboard** | Goal-alignment view — progress against the pod's research/network/talent/opportunity/brand objectives, plus an outreach-pipeline snapshot. |
| **Research · HIVE** | Profile and **score** startups & brands across founder, social, product, culture & funding. Weighted score /100 with Priority/Strong/Watchlist/Skip bands. Push strong leads straight into the Rolodex. |
| **Rolodex** | 7-stage outreach CRM (To Contact → Partner Won). Per-contact hypothesis, next action + date, channel, activity log, and a "Draft outreach" helper. |
| **Talent Map** | Map pod members **and** academic-partner students by skill, level and availability. Place / unplace people on opportunities. |
| **Opportunity Canvas** | Post internships, gigs and projects, then share them with students across channels. |
| **Partners** | Academic partners (clubs & councils) and industry partners. |
| **Sponsorship Leverage** | Per academic partner: a dashboard of the value your pod can mobilise for them (reach, events, content, talent) — each asset with audience, format and status. |
| **Per-partner Talent Map** | Each academic partner has its own talent map of its students. |
| **Ask Moksha** | In-app AI assistant for questions about Caarya & the portal. Calls `chirag-ai` when configured, falls back to a built-in knowledge base offline. |

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v4** (dark ruby/amber design system in `src/index.css`)
- **React Router v6**, **TanStack Query**, **Recharts**, **lucide-react**
- **Temporary admin** username/password auth via the shared backend

## Auth

Sign-in uses the shared local auth backend and the same Mongo `users` collection as the main frontend. Only `super_admin` / `["*"]` users can access this admin app.

All feature data (research, rolodex, talent, jobs, partners) is this app's own and is stored in `localStorage` via a REST-shaped collection store (`src/lib/store.ts`) — designed to be swapped for a dedicated backend later without touching the pages.

Default admin credentials:

- Username: `testadmin`
- Password: `moksha123`

## Getting started

```bash
npm install
cp .env.example .env   # fill in backend values
npm run dev            # http://localhost:3000
```

Build:

```bash
npm run build          # tsc -b && vite build  →  dist/
```

## Configuration

See `.env.example`. Key vars:

- `VITE_AUTH_API_URL` — shared backend base URL, incl. `/api`.
- `VITE_AI_URL` — optional `chirag-ai` base for the Ask Moksha agent.

## Project structure

```
src/
├── components/
│   ├── layout/      # Sidebar, Topbar, AppShell, IndiaBackdrop, CaaryaLogo
│   ├── ui/          # Button, Card, Badge, Drawer, Field, StatCard, ...
│   ├── research/    # HIVE editor
│   ├── rolodex/     # ContactDrawer
│   ├── talent/      # TalentGrid, TalentDrawer
│   ├── jobs/        # JobDrawer
│   └── partners/    # PartnerDrawer
├── contexts/        # AuthContext (username/password admin login)
├── config/          # env, nav
├── lib/
│   ├── data/        # seed collections, scoring, transforms
│   ├── api.ts       # auth + user CRUD helpers
│   ├── ai.ts        # Ask Moksha (chirag-ai + local fallback)
│   ├── store.ts     # localStorage collection store (REST-shaped)
│   ├── types.ts     # domain types
│   └── constants.ts # stage/status maps
└── pages/           # Dashboard, Research, Rolodex, TalentMap, Opportunities,
                     # Partners, PartnerDetail, AskMoksha, Login
```
