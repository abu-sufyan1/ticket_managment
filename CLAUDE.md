# CLAUDE.md — HelpDesk Support Ticket System

## Project Spec Kit
Before starting any work, always read these files in order:
1. `.specify/constitution.md` — Project principles and non-negotiables
2. `.specify/spec.md` — Full feature requirements and API design
3. `.specify/plan.md` — Architecture decisions, folder structure, conventions
4. `.specify/tasks/` — Pick the next pending task and implement it

---

## Project Overview
Full stack AI-powered customer support ticket system.
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (runs on port 5173)
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL (runs on port 4000)
- **AI**: Anthropic Claude API (via backend only — never call from frontend)

---

## Common Commands

### Backend
```bash
cd backend
npm run dev          # Start dev server with nodemon
npm run build        # Compile TypeScript
npm run test         # Run Jest tests
npm run test:watch   # Watch mode
npx prisma migrate dev   # Run DB migrations
npx prisma studio        # Open Prisma GUI
```

### Frontend
```bash
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run test         # Run Vitest
npm run lint         # Run ESLint
```

### Docker
```bash
docker-compose up --build    # Start full stack
docker-compose down          # Stop all services
```

---

## Architecture

### Folder Structure
```
helpdesk/
├── frontend/src/
│   ├── api/          # Axios API client functions (one file per resource)
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route-level page components
│   ├── hooks/        # Custom React hooks
│   ├── context/      # AuthContext and global state
│   ├── types/        # Shared TypeScript interfaces
│   └── utils/        # Helper functions
│
└── backend/src/
    ├── routes/       # Express routers (one per resource)
    ├── controllers/  # Business logic called by routes
    ├── middleware/   # authMiddleware, requireRole, errorHandler
    ├── services/     # aiService.ts, emailService.ts
    ├── db/           # Prisma client instance
    └── utils/        # Shared backend utilities
```

### Key Patterns

**Backend route handler pattern:**
```typescript
router.get('/:id', authMiddleware, requireRole('agent', 'admin'), async (req, res, next) => {
  try {
    const result = await someController.getById(req.params.id);
    res.json({ data: result });
  } catch (error) {
    next(error); // Always pass to global error handler
  }
});
```

**API response shape:**
- Success: `{ data: T, message?: string }`
- Error: `{ error: string, details?: ZodIssue[] }`

**Frontend API call pattern:**
```typescript
// api/tickets.ts
export const getTicket = (id: string) =>
  axiosInstance.get<{ data: Ticket }>(`/tickets/${id}`).then(r => r.data.data);
```

**React Query pattern:**
```typescript
const { data, isLoading } = useQuery({ queryKey: ['ticket', id], queryFn: () => getTicket(id) });
```

---

## Coding Conventions
- **TypeScript strict mode** — no `any`, no non-null assertions without good reason
- **Named exports** everywhere — no default exports except route-level page components
- **Zod validation** on all incoming request bodies (backend) and all forms (frontend)
- **No raw SQL** — all DB access through Prisma client only
- **No Claude API calls from frontend** — all AI calls go through the backend `aiService.ts`
- **Error handling**: use `next(error)` on backend, catch errors in React Query on frontend
- **Commit format**: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
- **Comments**: explain *why*, not *what*

---

## User Roles
| Role | Permissions |
|---|---|
| `customer` | Submit tickets, view own tickets, reply to own tickets |
| `agent` | View all tickets, assign, update status, reply, use AI features |
| `admin` | Everything agent can do + user management |

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:password@localhost:5432/helpdesk
JWT_SECRET=your-secret-here
ANTHROPIC_API_KEY=your-key-here
EMAIL_API_KEY=your-key-here
INBOUND_EMAIL_ADDRESS=support@yourdomain.com
FROM_EMAIL=support@yourdomain.com
SENTRY_DSN=your-sentry-dsn
PORT=4000
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:4000/api
VITE_SENTRY_DSN=your-sentry-dsn
```

---

## Testing Rules
- Every new route must have corresponding tests before the task is considered done
- Mock external services (Claude API, email service) in all tests — never make real calls
- Test both the happy path and error cases (wrong role, missing fields, not found)
- Run `npm test` before every commit

---

## Current Task
Check `.specify/tasks/` for the current pending task. Complete them in order (task-01 → task-07).
