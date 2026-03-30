# Task 06 — Email Integration

## Goal
Enable customers to create and respond to tickets via email. Agents' replies in the app are sent to the customer via email.

## Email Service
- Use Postmark (or SendGrid Inbound) for inbound + outbound email
- Store `EMAIL_API_KEY`, `INBOUND_EMAIL_ADDRESS`, `FROM_EMAIL` in `.env`
- Create `backend/src/services/emailService.ts` for all outbound email sending

---

## Inbound Email → Ticket

### Backend
1. Set up inbound webhook in Postmark pointing to `POST /api/webhooks/email`
2. Webhook handler (no auth — but validate webhook secret header):
   - Parse: `from` email, `subject`, `text body`, `Message-ID` header, `In-Reply-To` header
   - If `In-Reply-To` matches an existing ticket's thread ID → add as a new `Message` on that ticket
   - If no match → create a new `Ticket` + first `Message`
   - Find or create a `User` record for the sender's email (role: `customer`)
3. Store email thread ID on the Ticket for future reply matching
4. Trigger auto-classification and auto-resolve (same as web submissions)

---

## Outbound Email → Customer

### Backend
1. After agent posts a reply via `POST /api/tickets/:id/messages`:
   - Look up the ticket's customer email
   - Send email via emailService with:
     - To: customer email
     - Subject: `Re: [Ticket #id] {subject}`
     - Body: agent's reply + ticket link
     - Reply-To: inbound support address (so customer reply threads correctly)
2. After auto-resolve:
   - Send email to customer with the AI-generated resolution

---

## Frontend
- No major UI changes — email replies appear in the conversation thread as normal messages
- Add a small "📧 via email" indicator badge on messages that came in via email

---

## Tests
- Mock the email service — never send real emails in tests
- Test inbound webhook: new email → new ticket created
- Test inbound webhook: reply email → added to existing ticket
- Test outbound: agent reply → email service called with correct recipient + body
- Test invalid webhook signature → 401

## Acceptance Criteria
- [ ] Customer sends email → ticket appears in the app
- [ ] Customer replies to email → message added to the correct ticket thread
- [ ] Agent replies in app → customer receives email
- [ ] Auto-resolved tickets send email to customer
- [ ] All tests pass with mocked email service

## Dependencies
- Task 05 complete
