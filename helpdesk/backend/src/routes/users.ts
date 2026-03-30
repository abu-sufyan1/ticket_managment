import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/usersController';

export const usersRouter = Router();

// All user-management routes require an authenticated admin
usersRouter.use(authMiddleware, requireRole('admin'));

usersRouter.get('/', listUsers);
usersRouter.post('/', createUser);
usersRouter.put('/:id', updateUser);
usersRouter.delete('/:id', deleteUser);
