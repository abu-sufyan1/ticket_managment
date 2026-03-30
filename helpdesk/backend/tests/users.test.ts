import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';

jest.mock('../src/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../src/db/prisma';

function makeToken(role: 'customer' | 'agent' | 'admin', id = 'admin-1') {
  return jwt.sign({ id, email: 'admin@example.com', role }, process.env.JWT_SECRET!);
}

const adminToken = makeToken('admin');
const customerToken = makeToken('customer', 'customer-1');

const mockUser = {
  id: 'user-2',
  name: 'Bob',
  email: 'bob@example.com',
  role: 'customer' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/users', () => {
  it('returns paginated user list for admin', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('creates a user and returns 201', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bob', email: 'bob@example.com', password: 'password123', role: 'customer' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('bob@example.com');
  });

  it('returns 409 for duplicate email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bob', email: 'bob@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bob' }); // missing email and password

    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Bob', email: 'bob@example.com', password: 'password123' });
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/users/:id', () => {
  it('updates a user successfully', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Bobby' });

    const res = await request(app)
      .put('/api/users/user-2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bobby' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Bobby');
  });

  it('returns 400 when admin tries to change their own role', async () => {
    const res = await request(app)
      .put('/api/users/admin-1') // same id as the token's id
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'customer' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/users/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/:id', () => {
  it('deletes a user successfully', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .delete('/api/users/user-2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 400 when admin tries to delete themselves', async () => {
    const res = await request(app)
      .delete('/api/users/admin-1') // same id as the token's id
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/users/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
