import request from 'supertest';
import bcrypt from 'bcryptjs';
import express from 'express';
import { app } from '../src/app';
import { authMiddleware } from '../src/middleware/authMiddleware';
import { requireRole } from '../src/middleware/requireRole';
import { errorHandler } from '../src/middleware/errorHandler';

// Mock Prisma so tests never touch a real database
jest.mock('../src/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../src/db/prisma';

// Mini app with one protected route and one role-gated route for middleware testing
const testApp = express();
testApp.use(express.json());
testApp.get(
  '/protected',
  authMiddleware,
  (_req, res) => { res.json({ ok: true }); }
);
testApp.get(
  '/admin-only',
  authMiddleware,
  requireRole('admin'),
  (_req, res) => { res.json({ ok: true }); }
);
testApp.use(errorHandler);

const mockUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  passwordHash: '',
  role: 'customer' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

describe('POST /api/auth/register', () => {
  it('returns 201 and a token for valid data', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
    // passwordHash must never be returned
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 409 for duplicate email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 and token for valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 12);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: hash });

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correctpassword', 12);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: hash });

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
  });
});

describe('authMiddleware', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
  });

  it('returns 200 when a valid token is provided', async () => {
    // Get a valid token by logging in
    const hash = await bcrypt.hash('password123', 12);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: hash });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    });
    const token = loginRes.body.data.token as string;

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('requireRole', () => {
  it('returns 403 when customer accesses admin-only route', async () => {
    const hash = await bcrypt.hash('password123', 12);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: hash });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    });
    const token = loginRes.body.data.token as string;

    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
