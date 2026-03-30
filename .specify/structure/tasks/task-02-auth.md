# Task 02 — Authentication (Backend + Frontend)

## Goal
Implement full JWT-based authentication with role-based access control.

## Backend Steps

1. Add `passwordHash`, `role` fields to `User` model in Prisma schema. Run migration.
2. Create `auth` router: `POST /api/auth/register`, `POST /api/auth/login`
3. Register: validate body with Zod, hash password with bcryptjs, save user, return JWT
4. Login: validate credentials, compare hash, return JWT + user info (no passwordHash)
5. Create `authMiddleware.ts`: verify JWT, attach `req.user`, return 401 if invalid
6. Create `requireRole(...roles)` middleware for RBAC
7. Write Jest + Supertest tests:
   - Register with valid data → 201
   - Register with duplicate email → 409
   - Login with valid credentials → 200 + token
   - Login with wrong password → 401
   - Access protected route without token → 401
   - Access admin route as customer → 403

## Frontend Steps

1. Create `AuthContext` with `user`, `token`, `login()`, `logout()` — persist token in localStorage
2. Create `ProtectedRoute` component that redirects to `/login` if not authenticated
3. Create `RoleGuard` component that redirects if user lacks required role
4. Build Login page: email + password form, call `POST /api/auth/login`, store token, redirect
5. Build Register page: name + email + password form, call `POST /api/auth/register`, auto-login
6. Add logout button in navbar that clears auth state

## Acceptance Criteria
- [ ] Can register a new user
- [ ] Can log in and receive a JWT
- [ ] JWT is sent with all subsequent API requests
- [ ] Unauthenticated users are redirected to /login
- [ ] Wrong-role users see a 403 / are redirected
- [ ] All backend auth tests pass

## Dependencies
- Task 01 complete
