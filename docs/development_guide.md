# Development Guide

This guide provides step-by-step instructions for setting up the development environment and running tests for the LTI ATS system.

## 🚀 Setup Instructions

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone the Repository

```bash
git clone git@github.com:LIDR-academy/AI4Devs-LTI-extended.git
cd AI4Devs-LTI-extended
```

### 2. Environment Configuration

Create environment files for both backend and frontend:

**Backend Environment** (`backend/.env`):

Prisma reads **`DATABASE_URL`** only (see `backend/prisma/schema.prisma`). Use a single URL that matches Docker Compose: host port **5433** maps to PostgreSQL **5432** inside the container.

```env
# Application Configuration
PORT=3000
NODE_ENV=development

# Prisma (required): user, password, host, port, database — use 127.0.0.1:5433 for local Compose
DATABASE_URL="postgresql://LTIdbUser:D1ymf8wyQEGthFR1E9xhCq@127.0.0.1:5433/LTIdb"
```

Optional legacy split variables (not used by Prisma unless your code reads them):

```env
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=LTIdbUser
DB_PASSWORD=D1ymf8wyQEGthFR1E9xhCq
DB_NAME=LTIdb
```

On **Windows**, prefer **`127.0.0.1`** over `localhost` in `DATABASE_URL` if `localhost` resolves to IPv6 (`::1`) and connections fail.

**Frontend Environment** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3000
```

### 3. Database Setup (PostgreSQL with Docker)

Start the PostgreSQL database using Docker Compose:

```bash
# Start PostgreSQL container
docker compose up -d

# Verify the database is running
docker compose ps
```

The PostgreSQL database will be available at:
- **Host**: `127.0.0.1` (recommended on Windows; see note above)
- **Host port**: `5433` (maps to port **5432** inside the container)
- **Database**: `LTIdb`
- **Username**: `LTIdbUser`
- **Password**: `D1ymf8wyQEGthFR1E9xhCq` (same value as `POSTGRES_PASSWORD` in `docker-compose.yml`)

**Fresh database (destructive):** removes the Postgres volume and reapplies migrations from scratch:

```bash
docker compose down -v
docker compose up -d
cd backend
npm run prisma:generate
npx prisma migrate deploy
```

**Full local reset (dev only, drops all data):** `npx prisma migrate reset` reapplies migrations and runs the seed script **only if** `package.json` defines a Prisma seed; this repository may not define one—check before relying on seeded data.

### 4. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Apply migrations (production-style; use on empty or existing schema)
npx prisma migrate deploy

# (Optional) Dev-only full reset: drops DB, reapplies migrations, runs seed if configured
# npx prisma migrate reset

# (Optional) Seed — only if prisma.seed is configured in package.json
# npx prisma db seed

# Start the development server
npm run dev
```

The backend API will be available at `http://localhost:3000`

### 5. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend application will be available at `http://localhost:3001`

### 6. Cypress Testing Suite Setup

```bash
# From the frontend directory
cd frontend

# Install Cypress (if not already installed)
npm install

# Open Cypress Test Runner (Interactive)
npm run cypress:open

# Or run tests headlessly
npm run cypress:run
```

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Database integration tests** (Prisma against a migrated PostgreSQL instance): ensure Docker `db` is running and `DATABASE_URL` uses host port **5433**, then:

```bash
cd backend
npm run test:integration
```

On Windows, `npm run test:integration` uses `cross-env` to set `RUN_DB_INTEGRATION=true` so Jest runs `candidate.prisma.integration.test.ts`.

### Frontend Testing

```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests with Cypress
npm run cypress:run

# Open Cypress Test Runner
npm run cypress:open
```

## Git branching (sequential tickets)

When work depends on a previous ticket (e.g. LTI-12 after LTI-11), avoid creating parallel feature branches from `main` that duplicate the same files.

- **Branch from the latest integrated line**: create `feature/LTI-NN-*` from `main` after the previous ticket is merged, or branch from the open predecessor feature branch and merge/rebase before opening the next PR.
- **One PR at a time into `main`**: merge ticket N before stacking N+1, unless you intentionally use stacked PRs with a clear base branch.
- **Prefer small deltas**: if a branch accidentally re-copied an entire predecessor tree, extract only the real diff (e.g. `git diff predecessor..current`) and reapply it as commits on top of `main` instead of rebasing duplicate blobs.
- **Use `git push --force-with-lease`** when you rewrite a remote feature branch after a rebase.

