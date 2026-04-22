# Cricket Tournament Management

An internal web application for managing office cricket tournaments. Replaces Excel/Forms with a real-time dashboard, team registration, individual player pool, draft assignments, and audit logging.

## Features

- **Public Dashboard** -- TV-friendly view with live stats, team rosters, and individual pool (auto-refreshes via SSE)
- **Team Registration** -- Register entire teams with up to 9 players
- **Individual Registration** -- Sign up as a free agent for the player pool
- **Draft Management** -- Admins/captains can assign pool players to teams or remove them
- **Audit Trail** -- Full history of who moved which player and when
- **Role-Based Access** -- ADMIN, CAPTAIN, and VIEWER roles with granular permissions
- **Microsoft Entra ID SSO** -- Azure AD integration for enterprise authentication
- **Dev Login** -- Quick login with seeded users for local development

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Zod validation |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | NextAuth.js with Azure AD + dev credentials |
| Real-time | Server-Sent Events (SSE) |
| Hosting | Docker, Vercel, or Azure App Service |

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+ (via Docker or a cloud provider)
- **npm** (included with Node.js)

## Quick Start (Local Development)

### 1. Clone and install

```bash
cd cricket-tournament
npm install
```

### 2. Set up the database

**Option A: Docker (recommended)**
```bash
docker compose up -d
```

**Option B: Cloud PostgreSQL**

Use any managed Postgres (Supabase, Neon, Azure Database for PostgreSQL, etc.) and copy the connection string.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`. For Docker, the default works as-is:
```
DATABASE_URL=postgresql://cricket:cricket_dev@localhost:5432/cricket_tournament
```

Generate a random secret for NextAuth:
```bash
openssl rand -base64 32
```

### 4. Run migrations and seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 6. Sign in (Dev Mode)

Go to [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin) and use the dev login dropdown:

| User | Email | Role |
|------|-------|------|
| Tournament Admin | admin@company.com | ADMIN |
| Rahul Sharma | captain1@company.com | CAPTAIN |
| Priya Patel | captain2@company.com | CAPTAIN |
| Amit Kumar | viewer@company.com | VIEWER |

## Microsoft Entra ID (Azure AD) Setup

1. Go to [Azure Portal](https://portal.azure.com) > **Microsoft Entra ID** > **App registrations** > **New registration**
2. Set:
   - **Name**: Cricket Tournament
   - **Supported account types**: Single tenant
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/azure-ad` (Web)
3. After creation, note:
   - **Application (client) ID** -> `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID** -> `AZURE_AD_TENANT_ID`
4. Go to **Certificates & secrets** > **New client secret** -> `AZURE_AD_CLIENT_SECRET`
5. Add these to your `.env` file

For production, add your deployed URL as an additional redirect URI:
```
https://your-domain.com/api/auth/callback/azure-ad
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Yes | Random 32+ character secret |
| `AZURE_AD_CLIENT_ID` | No | Azure AD app client ID |
| `AZURE_AD_CLIENT_SECRET` | No | Azure AD app client secret |
| `AZURE_AD_TENANT_ID` | No | Azure AD tenant ID |
| `ENABLE_DEV_LOGIN` | No | Set to "true" to enable dev login in production |

## TV Mode

Open the dashboard with `?tv=true` to enable TV mode:
```
http://localhost:3000/?tv=true
```

TV mode features:
- Extra-large fonts for readability on big screens
- Auto-cycles through teams every 10 seconds
- Real-time updates via SSE (no manual refresh needed)

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register/team` | Yes | Register a team |
| POST | `/api/register/individual` | Yes | Register as individual |
| GET | `/api/teams` | No | List all teams |
| GET | `/api/teams/:id/roster` | No | Get team roster |
| GET | `/api/pool` | No | List individual pool |
| POST | `/api/teams/:id/assign` | ADMIN/CAPTAIN | Assign player to team |
| POST | `/api/teams/:id/remove` | ADMIN/CAPTAIN | Remove player from team |
| GET | `/api/audit` | ADMIN | View audit log |
| GET | `/api/events` | No | SSE event stream |

## Running Tests

```bash
npm test
```

## Project Structure

```
cricket-tournament/
├── prisma/
│   ├── schema.prisma          # Database schema (6 models)
│   └── seed.ts                # Sample data
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard (TV mode)
│   │   ├── register/          # Registration page
│   │   ├── manage/            # Admin/Captain management
│   │   ├── audit/             # Audit log viewer
│   │   ├── auth/signin/       # Login page
│   │   └── api/               # All API routes
│   ├── components/
│   │   ├── ui/                # Card, Badge, Button
│   │   ├── dashboard/         # StatsCards, TeamSelector, RosterList, PoolTable
│   │   ├── registration/      # TeamForm, IndividualForm
│   │   ├── manage/            # (management components inline)
│   │   ├── audit/             # (audit table inline)
│   │   └── layout/            # Navbar, Providers
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── sse.ts             # SSE event emitter
│   │   ├── useSSE.ts          # Client-side SSE hook
│   │   ├── validators.ts      # Zod schemas
│   │   ├── utils.ts           # cn() utility
│   │   └── business/
│   │       ├── registration.ts # Team/individual registration logic
│   │       ├── assignment.ts   # Assign/remove player logic
│   │       └── audit.ts        # Audit log helper
│   └── __tests__/             # Unit tests
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

## Deployment

### Vercel + Managed Postgres

1. Push code to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add a Postgres database (Vercel Postgres or Neon)
4. Set environment variables in Vercel dashboard
5. Vercel runs `prisma generate` automatically via the `postinstall` script
6. Run migrations: `npx prisma migrate deploy` (via Vercel CLI or a build hook)

### Azure App Service

1. Build the Docker image:
   ```bash
   docker build -t cricket-tournament .
   ```
2. Push to Azure Container Registry or Docker Hub
3. Create an Azure App Service (Linux, container)
4. Set environment variables in App Service Configuration
5. Use Azure Database for PostgreSQL (Flexible Server) for the database
6. Run migrations via SSH or a startup script:
   ```bash
   npx prisma migrate deploy
   ```

## License

Internal use only.
