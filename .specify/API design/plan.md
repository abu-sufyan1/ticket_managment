# Project Plan — HelpDesk Support Ticket System

## Repository Structure

```
helpdesk/
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/            # Axios API client functions
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # Auth context / global state
│   │   ├── types/          # Shared TypeScript types
│   │   └── utils/          # Helper functions
│   ├── CLAUDE.md
│   └── vite.config.ts
│
├── backend/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/         # Express route handlers
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/      # Auth, error handling, validation
│   │   ├── services/       # External integrations (Claude API, email)
│   │   ├── db/             # Prisma schema + migrations
│   │   └── utils/          # Shared utilities
│   ├── tests/              # Jest + Supertest integration tests
│   └── CLAUDE.md
│
├── .specify/               # Spec Kit files
│   ├── constitution.md
│   ├── spec.md
│   ├── plan.md
│   └── tasks/
│
├── CLAUDE.md               # Root-level Claude memory
└── docker-compose.yml
```

---

## Architecture Decisions

### Frontend
- **React 19** with functional components and hooks only — no class components
- **React Router v7** for client-side routing with protected route wrappers
- **Axios** for all API calls, with a shared instance that attaches the JWT token
- **React Query (TanStack Query)** for server state management and caching
- **Tailwind CSS** for styling — utility-first, no CSS modules
- **React Hook Form + Zod** for all form validation
- State: server state via React Query, UI state via useState/useReducer. No Redux.

### Backend
- **Express** with TypeScript — one router file per resource
- **Prisma ORM** with PostgreSQL — all DB access through Prisma client
- **JWT** for authentication — token stored in httpOnly cookie or Authorization header
- **Zod** for request body validation in all controllers
- **Middleware stack**: cors → json parser → auth validator → route handler → error handler
- All errors thrown as custom `AppError` instances and caught by the global error handler

### Database Schema (key models)
```
User        { id, name, email, passwordHash, role, createdAt }
Ticket      { id, subject, description, status, priority, category, customerId, assignedAgentId, createdAt }
Message     { id, body, ticketId, authorId, isAiGenerated, createdAt }
KnowledgeBase { id, title, content, createdAt }
```

### AI Integration
- All Claude API calls go through a single `aiService.ts` in the backend
- Never call the Claude API directly from the frontend
- Use `claude-sonnet-4-20250514` model for all AI features
- Wrap all AI calls in try/catch — AI failure must not break the core app

### Email Integration
- Use an email service with inbound webhook support (e.g., Postmark, SendGrid Inbound)
- Inbound webhook → `POST /api/webhooks/email` → parse → create ticket or add message
- Outbound: triggered when agent posts a reply → email sent via the same service

### Testing Strategy
- **Backend**: Jest + Supertest — test every route with auth and without, test happy path + error cases
- **Frontend**: Vitest + React Testing Library — test components and user interactions
- Use an in-memory SQLite or test PostgreSQL DB for backend tests
- CI runs all tests on every PR

---

## Implementation Phases

### Phase 1 — Foundation & Auth
Set up monorepo structure, configure tooling, implement JWT auth end-to-end

### Phase 2 — User Management
Admin CRUD for users with role assignment and full test coverage

### Phase 3 — Ticket Core
Ticket submission, list with filtering/sorting/pagination, ticket detail with reply

### Phase 4 — AI Features
Reply polisher, summarization, auto-classification, auto-resolve background job

### Phase 5 — Email Integration
Inbound webhook processing, outbound email on agent reply, thread management

### Phase 6 — Production
Sentry integration, Docker setup, CI/CD pipeline, cloud deployment, GitHub Actions + Claude Code

---

## Coding Conventions

- **File naming**: `camelCase.ts` for utilities, `PascalCase.tsx` for React components
- **Exports**: named exports everywhere — no default exports except page components
- **Error handling**: always use the global error handler on the backend — never send raw errors to the client
- **API responses**: always return `{ data, message }` shape for success, `{ error, details }` for errors
- **Types**: define all shared types in a `types/` folder — never use `any`
- **Comments**: only comment the *why*, not the *what* — code should be self-documenting
- **Commits**: conventional commits format — `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
