import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

// Fields safe to return — never include passwordHash
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['customer', 'agent', 'admin']).default('customer'),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['customer', 'agent', 'admin']).optional(),
});

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, select: safeUserSelect, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ]);

    res.json({ data: { users, total, page, limit } });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return next(new AppError('Email already in use', 409));
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: body.role },
      select: safeUserSelect,
    });

    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    // Prevent admin from changing their own role (could lock themselves out)
    const body = updateUserSchema.parse(req.body);
    if (body.role && req.user?.id === id) {
      return next(new AppError('You cannot change your own role', 400));
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('User not found', 404));
    }

    // Check for email collision only if email is changing
    if (body.email && body.email !== existing.email) {
      const collision = await prisma.user.findUnique({ where: { email: body.email } });
      if (collision) {
        return next(new AppError('Email already in use', 409));
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: safeUserSelect,
    });

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    if (req.user?.id === id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('User not found', 404));
    }

    await prisma.user.delete({ where: { id } });
    res.json({ data: null, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}
