# Task 04 — Ticket Management (Core)

## Goal
Build the complete ticket lifecycle: submission by customer, list view for agents, and detail view with replies.

## Database
Add to Prisma schema and migrate:
- `Ticket` model: id, subject, description, status, priority, category, customerId, assignedAgentId, createdAt, updatedAt
- `Message` model: id, body, ticketId, authorId, isAiGenerated, createdAt
- Status enum: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- Priority enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

## Backend Steps

1. `POST /api/tickets` (customer) — create ticket, auto-create first message from description
2. `GET /api/tickets/mine` (customer) — own tickets only, paginated
3. `GET /api/tickets` (agent/admin) — all tickets with filters: status, priority, assignedAgentId, search by subject. Paginated + sortable.
4. `GET /api/tickets/:id` — full ticket + all messages. Customer can only see own ticket.
5. `PUT /api/tickets/:id` (agent/admin) — update status, priority, assignedAgentId
6. `POST /api/tickets/:id/assign` (agent) — assign ticket to self
7. `POST /api/tickets/:id/messages` (agent or ticket owner) — add reply message
8. Write tests for all routes including auth and role checks

## Frontend Steps

1. **Ticket Submission Page** (`/tickets/new`):
   - Form: subject, description, priority selector
   - Submit → redirect to `/tickets/mine`

2. **My Tickets Page** (`/tickets/mine`) — customer view:
   - Table: subject, status badge, priority, created date
   - Click row → ticket detail

3. **Ticket List Page** (`/tickets`) — agent/admin view:
   - Table with all tickets
   - Filter bar: status, priority, assigned agent
   - Sort by: date, priority, status
   - Pagination controls

4. **Ticket Detail Page** (`/tickets/:id`):
   - Header: subject, status badge, priority, assigned agent, category
   - Action bar: "Assign to me" button, status dropdown
   - Conversation thread — messages in chronological order, author + timestamp
   - Reply box at bottom — textarea + submit button

## Acceptance Criteria
- [ ] Customer can submit a ticket
- [ ] Agent sees all tickets with working filters, sort, and pagination
- [ ] Customer sees only their own tickets
- [ ] Agent can assign, update status, and reply
- [ ] Conversation thread displays correctly
- [ ] All backend tests pass

## Dependencies
- Task 02, Task 03 complete
