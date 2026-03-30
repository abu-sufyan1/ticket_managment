import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedAgentId: z.string().nullable().optional(),
  category: z.string().optional(),
});

const createMessageSchema = z.object({
  body: z.string().min(1),
});

// Reusable include for full ticket + messages
const ticketInclude = {
  customer: { select: { id: true, name: true, email: true } },
  assignedAgent: { select: { id: true, name: true, email: true } },
  messages: {
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createTicketSchema.parse(req.body);
    const customerId = req.user!.id;

    const ticket = await prisma.ticket.create({
      data: {
        subject: body.subject,
        description: body.description,
        priority: body.priority,
        customerId,
        // Auto-create the opening message from description
        messages: {
          create: {
            body: body.description,
            authorId: customerId,
          },
        },
      },
      include: ticketInclude,
    });

    res.status(201).json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function getMyTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
    const skip = (page - 1) * limit;
    const customerId = req.user!.id;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true } }, assignedAgent: { select: { id: true, name: true } } },
      }),
      prisma.ticket.count({ where: { customerId } }),
    ]);

    res.json({ data: { tickets, total, page, limit } });
  } catch (error) {
    next(error);
  }
}

export async function listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
    const skip = (page - 1) * limit;

    type OrderField = 'createdAt' | 'priority' | 'status';
    const sortBy = (String(req.query.sortBy ?? 'createdAt')) as OrderField;
    const sortDir = req.query.sortDir === 'asc' ? 'asc' : ('desc' as const);

    // Build the where filter from query params
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.priority) where.priority = String(req.query.priority);
    if (req.query.assignedAgentId) where.assignedAgentId = String(req.query.assignedAgentId);
    if (req.query.search) {
      where.subject = { contains: String(req.query.search), mode: 'insensitive' };
    }

    const validSortFields: OrderField[] = ['createdAt', 'priority', 'status'];
    const orderByField: OrderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortDir },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignedAgent: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({ data: { tickets, total, page, limit } });
  } catch (error) {
    next(error);
  }
}

export async function getTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });

    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    // Customers can only view their own tickets
    if (req.user!.role === 'customer' && ticket.customerId !== req.user!.id) {
      return next(new AppError('Ticket not found', 404));
    }

    res.json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const body = updateTicketSchema.parse(req.body);

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Ticket not found', 404));
    }

    const ticket = await prisma.ticket.update({ where: { id }, data: body, include: ticketInclude });
    res.json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function assignTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Ticket not found', 404));
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { assignedAgentId: req.user!.id, status: 'IN_PROGRESS' },
      include: ticketInclude,
    });
    res.json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function createMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = String(req.params.id);
    const body = createMessageSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    // Customers can only reply to their own tickets
    if (req.user!.role === 'customer' && ticket.customerId !== req.user!.id) {
      return next(new AppError('Ticket not found', 404));
    }

    const message = await prisma.message.create({
      data: { body: body.body, ticketId, authorId: req.user!.id },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
}
