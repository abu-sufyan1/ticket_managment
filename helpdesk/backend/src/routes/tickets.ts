import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  createTicket,
  getMyTickets,
  listTickets,
  getTicket,
  updateTicket,
  assignTicket,
  createMessage,
  polishReplyHandler,
  summarizeHandler,
} from '../controllers/ticketsController';

export const ticketsRouter = Router();

// All ticket routes require authentication
ticketsRouter.use(authMiddleware);

// Customer: submit a ticket
ticketsRouter.post('/', requireRole('customer'), createTicket);

// Customer: own tickets only
ticketsRouter.get('/mine', requireRole('customer'), getMyTickets);

// Agent/Admin: all tickets with filters
ticketsRouter.get('/', requireRole('agent', 'admin'), listTickets);

// Any authenticated user: single ticket (ownership enforced in controller)
ticketsRouter.get('/:id', getTicket);

// Agent/Admin: update ticket fields
ticketsRouter.put('/:id', requireRole('agent', 'admin'), updateTicket);

// Agent/Admin: assign ticket to self
ticketsRouter.post('/:id/assign', requireRole('agent', 'admin'), assignTicket);

// Agent or ticket owner: add a reply message
ticketsRouter.post('/:id/messages', createMessage);

// AI endpoints — agent/admin only
ticketsRouter.post('/:id/polish-reply', requireRole('agent', 'admin'), polishReplyHandler);
ticketsRouter.post('/:id/summarize', requireRole('agent', 'admin'), summarizeHandler);
