# Task 05 — AI Features

## Goal
Integrate Claude API to add reply polishing, ticket summarization, auto-classification, and auto-resolution.

## Setup
- Create `backend/src/services/aiService.ts`
- All Claude API calls go through this single service
- Use model: `claude-sonnet-4-20250514`
- Wrap every call in try/catch — AI failure must not break the core app
- Store `ANTHROPIC_API_KEY` in `.env`

---

## Feature A — Reply Polisher

### Backend
- `POST /api/tickets/:id/polish-reply` (agent only)
- Body: `{ draft: string }`
- Send draft + ticket context to Claude with prompt: rewrite professionally, on-brand, keep the intent
- Return: `{ polishedReply: string }`

### Frontend
- On ticket detail page, add "✨ Polish Reply" button next to the reply textarea
- On click: send draft to API, show loading state, replace textarea content with polished reply
- Agent can still edit before sending

---

## Feature B — Ticket Summarization

### Backend
- `POST /api/tickets/:id/summarize` (agent only)
- Fetch all messages for the ticket
- Send to Claude: "Summarize this support conversation concisely in 3-5 sentences"
- Return: `{ summary: string }`

### Frontend
- On ticket detail page, add "📋 Summarize" button in the header area
- On click: call API, show loading spinner, display summary in a highlighted box above the conversation thread
- Cache result — don't re-call if summary already shown

---

## Feature C — Auto-Classification

### Backend
- Trigger: after `POST /api/tickets` creates a ticket, run classification in the background (don't await — fire and forget)
- Send ticket subject + description to Claude
- Claude returns: `{ category: string, suggestedPriority: string }`
- Update the ticket record with category and optionally override priority
- No frontend change needed — classification shows up on ticket detail automatically

---

## Feature D — Auto-Resolve

### Backend
- Trigger: same background job as classification, runs after ticket creation
- Load all `KnowledgeBase` entries from DB
- Send ticket + knowledge base to Claude: "Can you resolve this ticket using the knowledge base? If yes, provide the reply. If no, say ESCALATE."
- If Claude returns a resolution:
  - Create a new Message on the ticket with `isAiGenerated: true`
  - Update ticket status to `RESOLVED`
- If Claude returns ESCALATE:
  - Leave ticket as `OPEN`
- Add a `KnowledgeBase` seed file with 5-10 sample entries for testing

### Frontend
- On ticket detail page, show a badge on AI-generated messages: "🤖 Auto-resolved"

---

## Tests
- Mock the Claude API in tests — never make real API calls in test suite
- Test polish-reply with a draft → returns polished string
- Test summarize with messages → returns summary
- Test auto-classification updates ticket category
- Test auto-resolve: when KB has answer → ticket resolved; when not → stays open

## Acceptance Criteria
- [ ] Polish reply rewrites agent draft professionally
- [ ] Summarize button shows a concise summary of the conversation
- [ ] Every new ticket gets auto-classified
- [ ] Tickets with matching KB answers are auto-resolved with AI reply
- [ ] AI failures do not crash the application
- [ ] All tests pass with mocked Claude API

## Dependencies
- Task 04 complete
