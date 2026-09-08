# Team Web Project — React + Express + MongoDB

A team-ready monorepo for a web application.

## Stack

- Frontend: React + Vite
- Backend: Express
- Database: MongoDB
- ODM: Mongoose
- HTTP client: Axios
- Code quality: ESLint + Prettier
- Source control: Git + GitHub

## Folder structure

- `frontend/` — React application
- `backend/` — Express REST API
- `database/` — MongoDB documentation, seed data and database scripts
- `docs/` — requirements, architecture, API and database docs
- `scripts/` — project utilities
- `.github/` — CI and CODEOWNERS

## Requirements

- Node.js 20+
- npm 10+
- Git
- MongoDB Server 7+ or 8+ installed locally
- MongoDB Compass is optional

## First setup

1. Install MongoDB locally and make sure the MongoDB service is running.
2. Copy `backend/.env.example` to `backend/.env`.
3. Copy `frontend/.env.example` to `frontend/.env`.
4. From the project root run:

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000
Health: http://localhost:5000/api/health

## Database

Default local database:

`mongodb://127.0.0.1:27017/team_web_project`

MongoDB creates the database when the first document is written.

For MongoDB Atlas, replace `MONGODB_URI` in `backend/.env` with the Atlas connection string.

## Git workflow

- `main` — stable/production
- `develop` — team integration
- `feature/*` — features
- `fix/*` — bug fixes
- `refactor/*` — refactoring
- `docs/*` — documentation

Never push directly to `main` or `develop`.

See `CONTRIBUTING.md` and `docs/PROJECT_RULES.md`.
