# Task 07 — Production: Logging, Docker, CI/CD, Deployment

## Goal
Make the application production-ready: error logging, Docker, GitHub Actions CI/CD, and live deployment.

---

## Step 1 — Error Logging (Sentry)

### Backend
- Install `@sentry/node`
- Initialize Sentry in `app.ts` before route handlers
- Add Sentry error handler middleware after all routes
- Capture unhandled promise rejections
- Store `SENTRY_DSN` in `.env`

### Frontend
- Install `@sentry/react`
- Initialize in `main.tsx`
- Wrap app in `Sentry.ErrorBoundary`
- Capture unhandled errors and performance data

---

## Step 2 — UI Polish
- Consistent color palette and typography across all pages
- Loading skeletons for data-fetching states
- Empty states for lists with no data
- Responsive layout (works on tablet + desktop)
- Toast notification system for success/error feedback
- 404 page for unknown routes

---

## Step 3 — Dockerize

### Backend `Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

### Frontend `Dockerfile`
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

### `docker-compose.yml` (root)
- Services: `frontend`, `backend`, `postgres`
- Environment variables from `.env`
- Health checks on all services
- Volume for postgres data persistence

---

## Step 4 — GitHub Actions CI/CD

### `.github/workflows/ci.yml`
- Trigger: on every PR
- Jobs:
  - `test-backend`: install deps → run Jest tests
  - `test-frontend`: install deps → run Vitest tests
  - `lint`: run ESLint on both projects

### `.github/workflows/deploy.yml`
- Trigger: on push to `main`
- Jobs:
  - Run all tests
  - Build Docker images
  - Push to container registry
  - Deploy to cloud host

---

## Step 5 — Claude Code + GitHub Actions
- Set up Claude Code in GitHub Actions using `ANTHROPIC_API_KEY` secret
- When an issue is created with label `claude`, Claude:
  - Reads the issue
  - Creates a branch
  - Implements the fix
  - Opens a PR with the changes
- Engineer reviews and merges → triggers deployment

---

## Acceptance Criteria
- [ ] Sentry captures errors in both frontend and backend
- [ ] `docker-compose up` starts the full stack successfully
- [ ] CI pipeline runs all tests on every PR
- [ ] Merging to main triggers auto-deployment
- [ ] Application is live and accessible at a public URL
- [ ] Claude Code can auto-fix a labeled GitHub issue and open a PR

## Dependencies
- Task 06 complete
