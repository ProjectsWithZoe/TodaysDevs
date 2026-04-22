# TodaysDevs

A platform for developers to practice by building real projects — solo or with a partner. Browse projects, open a workspace room, download the starter files, and submit your work when done.

---

## What it does

- **Project browser** — two tabs of projects pulled directly from GitHub:
  - **HTML / CSS / JS** — from [`TodaysDevs/html-css-js`](https://github.com/TodaysDevs/html-css-js)
  - **Python** — from [`TodaysDevs/python-projects`](https://github.com/TodaysDevs/python-projects)
- **Rooms** — start a solo or team session on any project
- **File download** — grab the project starter files as a ZIP directly from GitHub
- **Submissions** — submit a repo link for review when you're done
- **Leaderboard** — see scores across the platform

---

## Tech stack

**Client** (`client/`)
| | |
|---|---|
| Framework | React 18 + React Router v6 |
| Build | Vite 5 |
| Styling | Tailwind CSS v4 |
| HTTP | Axios |
| Auth | Better Auth |
| State | Zustand |

**Server** (`server/`)
| | |
|---|---|
| Framework | Fastify 4 |
| Database | PostgreSQL (via `pg`) |
| Auth | Better Auth |
| Email | Resend |
| GitHub data | GitHub REST API (authenticated) |
| ZIP builds | JSZip |

---

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or remote)
- A [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope (for reading project repos)
- A [Resend](https://resend.com) API key (for emails)

### 1. Install dependencies

```bash
npm install
```

This installs both the client and server workspaces.

### 2. Configure environment variables

Create `server/.env` (see [Environment variables](#environment-variables) below).

Create `client/.env`:

```
VITE_API_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### 3. Run database migrations

```bash
npm run migrate
```

### 4. Start the dev servers

In two separate terminals:

```bash
# Terminal 1 — API server (default: http://localhost:3000)
npm run dev:server

# Terminal 2 — Vite dev server (default: http://localhost:5173)
npm run dev:client
```

---

## Environment variables

### `server/.env`

```bash
# PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/todaysdevs

# GitHub personal access token (repo scope) — used to fetch projects and build ZIPs
GITHUB_TOKEN=ghp_your_token_here

# Better Auth
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000

# The frontend origin (used for CORS)
CLIENT_ORIGIN=http://localhost:5173

# Cookie signing secret
COOKIE_SECRET=your_cookie_secret_here

# Resend — transactional email
RESEND_API_KEY=re_your_key_here
RESEND_FROM=noreply@yourdomain.com

# Optional
PORT=3000
NODE_ENV=development
```

### `client/.env`

```bash
# Points to the running API server
VITE_API_URL=http://localhost:3000

# Mapbox GL token (used for the location map on profiles)
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

---

## Repo structure

```
newdev/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/             # Axios client + interceptors
│       ├── components/      # Shared UI components
│       ├── pages/           # Route-level page components
│       ├── hooks/           # Custom React hooks
│       ├── store/           # Zustand stores
│       └── lib/             # Constants and utilities
│
├── server/                  # Fastify backend
│   ├── routes/              # Route handlers (projects, rooms, auth, …)
│   ├── services/            # GitHub API client with TTL cache
│   ├── db/
│   │   └── migrations/      # SQL migration files (run in order)
│   ├── hooks/               # Fastify lifecycle hooks (auth, roles)
│   └── lib/                 # Shared utilities
│
└── openspec/                # Specs and change proposals
    ├── specs/               # Capability specs
    └── changes/             # In-progress and completed changes
```

---

## Project tabs

Projects are fetched server-side using a `GITHUB_TOKEN` and cached for 5 minutes.

| Tab | Source repo | Metadata |
|---|---|---|
| HTML / CSS / JS | `TodaysDevs/html-css-js` | `project.json` in each folder |
| Python | `TodaysDevs/python-projects` | `project.json` if present, otherwise folder name |

Each folder in those repos is one project. The server reads `project.json` for the title and description, then enriches the list with a live `active_count` (number of users currently in a room for that project) from the database.

When a user opens a project, the server records which GitHub repo it came from and passes that through the room and download flows — so file downloads always pull from the correct repo.

---

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev:server` | Start the Fastify API server with hot reload |
| `npm run dev:client` | Start the Vite dev server |
| `npm run migrate` | Run all pending SQL migrations |
| `npm run seed` | Seed initial data (roles) |
