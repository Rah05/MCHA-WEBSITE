# MCHA-WEBSITE

CSC 190 - Team Code Blooded - M.CHA Website

Website for M.CHA: product browsing and checkout for customers, pop-up events, and admin/staff tools.

- **Jira board:** https://codeblooded.atlassian.net/jira/software/projects/SCRUM/boards/1
- **Integration branch:** `develop` (all feature work merges here first)

> **⚠️ Database is moving from PostgreSQL to MySQL** (decided in #backend). The code on `develop` still uses PostgreSQL, so the database steps below are for Postgres and will be updated once the backend switches to MySQL.

## Tech stack

| Part | Tech |
|---|---|
| Frontend | React 19 + Vite (`frontend/`) |
| Backend | Node.js + Express 5 (`backend/`) |
| Database | PostgreSQL (via `pg`) for now; **switching to MySQL** |
| Auth | `bcrypt` for password hashing, `jsonwebtoken` for login tokens |
| Payments | Square (not Stripe) |
| Hosting | Render (suggested) |

## Project structure

```
MCHA-WEBSITE/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── routes/            # One file per feature (e.g. health.js, auth.js)
│   ├── controllers/       # Request handlers used by routes
│   ├── middleware/        # Auth checks, role guards, etc.
│   ├── db/
│   │   ├── pool.js        # Postgres connection (reads DATABASE_URL)
│   │   └── schema.sql     # Database tables
│   └── .env.example       # Template for your local backend/.env
└── frontend/
    ├── index.html
    ├── vite.config.js     # Dev server on :5173, proxies /api to :3000
    └── src/
        ├── main.jsx
        ├── App.jsx        # Page routes
        ├── pages/         # One component per page
        ├── components/    # Shared components
        └── api/           # Functions that call the backend (one file per feature)
```

## Prerequisites

- **Node.js 22 LTS** (or 20.19+). Vite 8 will not run on Node 18. Check with `node --version`.
- **PostgreSQL 15+** running locally, or a hosted Postgres database URL.
- **Git**

## Local setup

### 1. Clone the repo and switch to `develop`

```bash
git clone https://github.com/Rah05/MCHA-WEBSITE.git
cd MCHA-WEBSITE
git checkout develop
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in your values:

| Variable | What it is |
|---|---|
| `PORT` | Port for the API. Leave as `3000` (the frontend proxy expects it). |
| `DATABASE_URL` | Your Postgres connection string, e.g. `postgresql://postgres:password@localhost:5432/mcha` |
| `DATABASE_SSL` | `false` for a local database, `true` for most hosted databases |
| `JWT_SECRET` | Any long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

**Never commit `.env`.** It's ignored by git; only `.env.example` belongs in the repo. If you add a new variable, add it to `.env.example` with a placeholder value.

Create the database and tables:

```bash
createdb mcha
psql "postgresql://postgres:password@localhost:5432/mcha" -f db/schema.sql
```

Start the API:

```bash
npm run dev      # restarts automatically when you save (nodemon)
# or
npm start
```

Check it works: open http://localhost:3000/api/health. You should see `"status": "ok"` and `"database": "connected"`.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Requests to `/api/...` are forwarded to the backend on port 3000, so keep both running.

### Useful scripts

| Where | Command | What it does |
|---|---|---|
| `backend/` | `npm run dev` | Start the API with auto-restart |
| `backend/` | `npm start` | Start the API |
| `frontend/` | `npm run dev` | Start the dev server |
| `frontend/` | `npm run build` | Production build into `frontend/dist/` |
| `frontend/` | `npm run lint` | Lint with oxlint |

## Git workflow

1. **Start from the latest `develop`:**
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/scrum-<number>-short-description
   ```
2. **Commit with the Jira key** so commits show up on the ticket:
   ```bash
   git commit -m "SCRUM-81 add customer sign-in form"
   ```
3. **Push and open a pull request into `develop`** (not `main`). Fill in the PR template.
4. **Get at least one teammate to review** before merging.
5. `develop` is merged into `main` when the team is ready to release.

Before opening a PR, pull the latest `develop` into your branch and fix any conflicts (`App.jsx` and `server.js` are shared by most features):

```bash
git checkout develop && git pull
git checkout your-branch
git merge develop
```

## Adding a feature

- **New API endpoint:** add `backend/routes/<feature>.js` (and a controller if it has logic), then register it in `server.js`: `app.use('/api/<feature>', require('./routes/<feature>'));`
- **New page:** add `frontend/src/pages/<Page>.jsx` and its route in `App.jsx`.
- **Calling the API from React:** add a helper in `frontend/src/api/<feature>.js`, like `api/health.js`.
- **New database table:** add it to `backend/db/schema.sql` using `CREATE TABLE IF NOT EXISTS` so the file can be re-run safely.
