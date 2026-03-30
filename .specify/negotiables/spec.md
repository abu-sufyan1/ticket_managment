# Project Spec — HelpDesk Support Ticket System

## Overview
A full stack AI-powered customer support ticket system. Customers submit tickets via a web form or email. Support agents manage, respond to, and resolve tickets through a rich dashboard. AI assists agents with summarization, reply polishing, auto-classification, and auto-resolution of common issues.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL with an ORM (Prisma) |
| Auth | JWT-based authentication |
| AI | Anthropic Claude API |
| Email | Inbound/outbound email integration |
| Testing | Vitest (frontend) + Jest/Supertest (backend) |
| Deployment | Docker + Cloud hosting |
| CI/CD | GitHub Actions + Claude Code |
| Error Logging | Sentry |

---

## User Roles

| Role | Description |
|---|---|
| `customer` | Submits and tracks their own support tickets |
| `agent` | Manages, responds to, and resolves tickets |
| `admin` | Full access including user management |

---

## Modules & Features

### 1. Authentication
- User registration (name, email, password)
- User login → returns JWT token
- Role-based access control (RBAC) on all protected routes
- Middleware to validate JWT and attach user to request
- Frontend route guards based on role

### 2. User Management (Admin only)
- List all users with pagination
- Create new user (assign role)
- Edit user details and role
- Delete user
- All actions backed by automated tests

### 3. Ticket Submission (Customer)
- Submit a new ticket with: subject, description, priority
- View own submitted tickets and their status
- Receive email notifications on status changes

### 4. Ticket List Page (Agent/Admin)
- View all tickets in a paginated table
- Filter by: status, priority, assigned agent, date range
- Sort by: date created, priority, status
- Pagination with configurable page size
- Quick status indicator badges

### 5. Ticket Detail Page (Agent)
- Full conversation thread/history view
- Assign ticket to self
- Update ticket status: Open → In Progress → Resolved → Closed
- Reply to customer directly from the ticket detail page
- View AI-generated summary and classification

### 6. AI Features

#### 6a. Reply Polisher
- Agent writes a draft reply
- One-click button to rewrite it using Claude API
- Output sounds professional and on-brand
- Agent can accept, edit, or discard the polished reply

#### 6b. Ticket Summarization
- One-click button on ticket detail page
- Claude reads the full conversation and returns a concise summary
- Displayed inline — agent does not need to scroll through long threads

#### 6c. Auto-Classification
- Triggered automatically when a new ticket arrives
- Claude classifies ticket into a category (e.g., billing, technical, account, general)
- Priority suggestion based on content analysis
- Classification stored and displayed on ticket detail

#### 6d. Auto-Resolve (Background Job)
- When a ticket arrives, a background job checks it against a knowledge base
- If Claude can answer it confidently, it:
  - Marks the ticket as resolved
  - Sends a professional reply to the customer automatically
- If Claude cannot resolve it, ticket stays open and is escalated to an agent

### 7. Email Integration
- Inbound: when customer sends email to support address, it creates a ticket in the system
- Outbound: when agent replies in the app, customer receives the reply via email
- Full email threading — replies are added to the correct ticket conversation
- Email-to-ticket parsing: extract subject, body, sender email

### 8. Production & Deployment
- Error logging with Sentry (frontend + backend)
- UI polish pass — consistent design system
- Dockerize frontend and backend with docker-compose
- Deploy to cloud (e.g., Render, Railway, or AWS)
- GitHub Actions CI/CD pipeline:
  - On PR: run tests
  - On merge to main: auto-deploy
  - Claude Code + GitHub Actions: Claude auto-fixes GitHub issues and opens PRs

---

## API Endpoints (High Level)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users` (admin)
- `POST /api/users` (admin)
- `PUT /api/users/:id` (admin)
- `DELETE /api/users/:id` (admin)

### Tickets
- `GET /api/tickets` (agent/admin — all tickets)
- `GET /api/tickets/mine` (customer — own tickets)
- `POST /api/tickets` (customer)
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id` (agent/admin)
- `POST /api/tickets/:id/replies`

### AI
- `POST /api/tickets/:id/summarize`
- `POST /api/tickets/:id/polish-reply`

### Email (Webhook)
- `POST /api/webhooks/email`

---

## Out of Scope (v1)
- Live chat
- Multi-language support
- Custom SLA rules
- Mobile app
