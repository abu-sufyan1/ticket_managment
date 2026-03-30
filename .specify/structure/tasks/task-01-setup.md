# Task 01 — Project Setup & Foundation

## Goal
Bootstrap the monorepo with frontend and backend projects, configure all tooling, and verify everything runs.

## Steps

1. Create root `helpdesk/` directory with `docker-compose.yml` placeholder
2. **Backend setup**:
   - Init Node.js + TypeScript project in `backend/`
   - Install: `express`, `prisma`, `@prisma/client`, `zod`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`
   - Install dev: `typescript`, `ts-node`, `nodemon`, `jest`, `supertest`, `@types/*`
   - Configure `tsconfig.json`
   - Set up Express app entry point with health check route `GET /api/health`
   - Set up Prisma with PostgreSQL connection
   - Create initial `schema.prisma` with `User` model
   - Run first migration
3. **Frontend setup**:
   - Init Vite + React 19 + TypeScript project in `frontend/`
   - Install: `react-router-dom`, `axios`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, `tailwindcss`
   - Configure Tailwind CSS
   - Set up Axios instance with base URL and JWT interceptor
   - Set up React Router with a basic home page
4. Verify backend starts on port 4000 and health check returns 200
5. Verify frontend starts on port 5173 and loads without errors
6. Add root `CLAUDE.md` pointing to `.specify/` files

## Acceptance Criteria
- [ ] `cd backend && npm run dev` starts without errors
- [ ] `GET http://localhost:4000/api/health` returns `{ status: "ok" }`
- [ ] `cd frontend && npm run dev` starts without errors
- [ ] Frontend loads in browser at `http://localhost:5173`
- [ ] Prisma connects to PostgreSQL successfully

## Dependencies
None — this is the first task
