import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';

jest.mock('../src/db/prisma', () => ({
  prisma: {
    ticket: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../src/db/prisma';

function makeToken(role: 'customer' | 'agent' | 'admin', id = 'user-1') {
  return jwt.sign({ id, email: 'test@example.com', role }, process.env.JWT_SECRET!);
}

const customerToken = makeToken('customer', 'customer-1');
const agentToken = makeToken('agent', 'agent-1');
const adminToken = makeToken('admin', 'admin-1');

const mockTicket = {
  id: 'ticket-1',
  subject: 'Login issue',
  description: 'Cannot log in',
  status: 'OPEN',
  priority: 'MEDIUM',
  category: null,
  customerId: 'customer-1',
  assignedAgentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: { id: 'customer-1', name: 'Alice', email: 'alice@example.com' },
  assignedAgent: null,
  messages: [],
};

beforeEach(() => jest.clearAllMocks());

// ─── POST /api/tickets ────────────────────────────────────────────────────────

describe('POST /api/tickets', () => {
  it('creates a ticket as customer → 201', async () => {
    (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);

    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subject: 'Login issue', description: 'Cannot log in', priority: 'MEDIUM' });

    expect(res.status).toBe(201);
    expect(res.body.data.subject).toBe('Login issue');
  });

  it('returns 403 when agent tries to submit a ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ subject: 'Test', description: 'Test', priority: 'LOW' });

    expect(res.status).toBe(403);
  });

  it('returns 400 for missing subject', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ description: 'No subject here' });

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/tickets/mine ────────────────────────────────────────────────────

describe('GET /api/tickets/mine', () => {
  it('returns customer own tickets → 200', async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([mockTicket]);
    (prisma.ticket.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .get('/api/tickets/mine')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tickets).toHaveLength(1);
  });

  it('returns 403 for agent', async () => {
    const res = await request(app)
      .get('/api/tickets/mine')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── GET /api/tickets ─────────────────────────────────────────────────────────

describe('GET /api/tickets', () => {
  it('returns all tickets for agent → 200', async () => {
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([mockTicket]);
    (prisma.ticket.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tickets).toHaveLength(1);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── GET /api/tickets/:id ─────────────────────────────────────────────────────

describe('GET /api/tickets/:id', () => {
  it('returns ticket for agent → 200', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

    const res = await request(app)
      .get('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('ticket-1');
  });

  it('returns ticket when customer is the owner → 200', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

    const res = await request(app)
      .get('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${customerToken}`); // customer-1 owns this ticket

    expect(res.status).toBe(200);
  });

  it('returns 404 when customer tries to access another user\'s ticket', async () => {
    const otherTicket = { ...mockTicket, customerId: 'other-customer' };
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(otherTicket);

    const res = await request(app)
      .get('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent ticket', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tickets/nonexistent')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/tickets/:id ─────────────────────────────────────────────────────

describe('PUT /api/tickets/:id', () => {
  it('updates ticket status for agent → 200', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({ ...mockTicket, status: 'IN_PROGRESS' });

    const res = await request(app)
      .put('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .put('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'CLOSED' });
    expect(res.status).toBe(403);
  });
});

// ─── POST /api/tickets/:id/assign ─────────────────────────────────────────────

describe('POST /api/tickets/:id/assign', () => {
  it('assigns ticket to agent → 200', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      ...mockTicket,
      assignedAgentId: 'agent-1',
      status: 'IN_PROGRESS',
    });

    const res = await request(app)
      .post('/api/tickets/ticket-1/assign')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
  });
});

// ─── POST /api/tickets/:id/messages ──────────────────────────────────────────

describe('POST /api/tickets/:id/messages', () => {
  it('agent can reply to any ticket → 201', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.message.create as jest.Mock).mockResolvedValue({
      id: 'msg-1',
      body: 'Hello',
      ticketId: 'ticket-1',
      authorId: 'agent-1',
      isAiGenerated: false,
      createdAt: new Date(),
      author: { id: 'agent-1', name: 'Bob', role: 'agent' },
    });

    const res = await request(app)
      .post('/api/tickets/ticket-1/messages')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ body: 'Hello' });

    expect(res.status).toBe(201);
    expect(res.body.data.body).toBe('Hello');
  });

  it('ticket owner (customer) can reply → 201', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.message.create as jest.Mock).mockResolvedValue({
      id: 'msg-2',
      body: 'Thanks',
      ticketId: 'ticket-1',
      authorId: 'customer-1',
      isAiGenerated: false,
      createdAt: new Date(),
      author: { id: 'customer-1', name: 'Alice', role: 'customer' },
    });

    const res = await request(app)
      .post('/api/tickets/ticket-1/messages')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ body: 'Thanks' });

    expect(res.status).toBe(201);
  });

  it('non-owner customer cannot reply → 404', async () => {
    const otherTicket = { ...mockTicket, customerId: 'other-customer' };
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(otherTicket);

    const res = await request(app)
      .post('/api/tickets/ticket-1/messages')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ body: 'Sneaky' });

    expect(res.status).toBe(404);
  });
});
