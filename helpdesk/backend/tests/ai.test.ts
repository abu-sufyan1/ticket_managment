import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';

// Mock Prisma
jest.mock('../src/db/prisma', () => ({
  prisma: {
    ticket: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    knowledgeBase: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock the AI service — never make real Claude API calls in tests
jest.mock('../src/services/aiService', () => ({
  polishReply: jest.fn(),
  summarizeTicket: jest.fn(),
  classifyTicket: jest.fn(),
  tryAutoResolve: jest.fn(),
}));

import { prisma } from '../src/db/prisma';
import * as aiService from '../src/services/aiService';

function makeToken(role: 'customer' | 'agent' | 'admin', id = 'user-1') {
  return jwt.sign({ id, email: 'test@example.com', role }, process.env.JWT_SECRET!);
}

const agentToken = makeToken('agent', 'agent-1');
const customerToken = makeToken('customer', 'customer-1');

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

// ─── POST /api/tickets/:id/polish-reply ───────────────────────────────────────

describe('POST /api/tickets/:id/polish-reply', () => {
  it('returns polished reply for agent', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
    (aiService.polishReply as jest.Mock).mockResolvedValue('This is the polished reply.');

    const res = await request(app)
      .post('/api/tickets/ticket-1/polish-reply')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ draft: 'hi please fix this' });

    expect(res.status).toBe(200);
    expect(res.body.data.polishedReply).toBe('This is the polished reply.');
    expect(aiService.polishReply).toHaveBeenCalledWith('Login issue', 'hi please fix this');
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .post('/api/tickets/ticket-1/polish-reply')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ draft: 'hello' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent ticket', async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/tickets/nonexistent/polish-reply')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ draft: 'hello' });
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/tickets/:id/summarize ─────────────────────────────────────────

describe('POST /api/tickets/:id/summarize', () => {
  it('returns summary for agent', async () => {
    const ticketWithMessages = {
      ...mockTicket,
      messages: [
        { id: 'm1', body: 'Issue here', author: { role: 'customer' } },
        { id: 'm2', body: 'We will look into it', author: { role: 'agent' } },
      ],
    };
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(ticketWithMessages);
    (aiService.summarizeTicket as jest.Mock).mockResolvedValue('Customer cannot log in. Agent is investigating.');

    const res = await request(app)
      .post('/api/tickets/ticket-1/summarize')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBe('Customer cannot log in. Agent is investigating.');
    expect(aiService.summarizeTicket).toHaveBeenCalledWith(
      'Login issue',
      expect.arrayContaining([{ authorRole: 'customer', body: 'Issue here' }])
    );
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .post('/api/tickets/ticket-1/summarize')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── Auto-classification and auto-resolve (triggered on POST /api/tickets) ───

describe('POST /api/tickets — AI background processing', () => {
  it('calls classifyTicket after ticket creation', async () => {
    (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.knowledgeBase.findMany as jest.Mock).mockResolvedValue([]);
    (aiService.classifyTicket as jest.Mock).mockResolvedValue({
      category: 'technical',
      suggestedPriority: 'HIGH',
    });
    (aiService.tryAutoResolve as jest.Mock).mockResolvedValue(null);

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subject: 'Login issue', description: 'Cannot log in', priority: 'MEDIUM' });

    // Give the background job a tick to run
    await new Promise((r) => setTimeout(r, 50));

    expect(aiService.classifyTicket).toHaveBeenCalledWith('Login issue', 'Cannot log in');
  });

  it('auto-resolves ticket when KB has an answer', async () => {
    const kb = [{ id: 'kb-1', title: 'Password reset', content: 'Click forgot password.', createdAt: new Date() }];
    (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.message.create as jest.Mock).mockResolvedValue({});
    (prisma.knowledgeBase.findMany as jest.Mock).mockResolvedValue(kb);
    (aiService.classifyTicket as jest.Mock).mockResolvedValue({ category: 'technical', suggestedPriority: 'LOW' });
    (aiService.tryAutoResolve as jest.Mock).mockResolvedValue('Please click forgot password to reset.');

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subject: 'Forgot my password', description: 'I forgot my password', priority: 'LOW' });

    await new Promise((r) => setTimeout(r, 50));

    expect(aiService.tryAutoResolve).toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isAiGenerated: true }) })
    );
  });

  it('leaves ticket OPEN when KB cannot resolve it', async () => {
    (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket);
    (prisma.knowledgeBase.findMany as jest.Mock).mockResolvedValue([]);
    (aiService.classifyTicket as jest.Mock).mockResolvedValue({ category: 'general', suggestedPriority: 'MEDIUM' });
    (aiService.tryAutoResolve as jest.Mock).mockResolvedValue(null);

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subject: 'Complex issue', description: 'Something weird', priority: 'HIGH' });

    await new Promise((r) => setTimeout(r, 50));

    // message.create should NOT have been called with isAiGenerated: true
    const aiCalls = (prisma.message.create as jest.Mock).mock.calls.filter(
      (call) => call[0]?.data?.isAiGenerated === true
    );
    expect(aiCalls).toHaveLength(0);
  });
});
