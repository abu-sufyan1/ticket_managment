# Task 03 — User Management (Admin)

## Goal
Build full CRUD user management for admins, with tests.

## Backend Steps

1. Create `users` router with all routes protected by `requireRole('admin')`
2. `GET /api/users` — list users with pagination (`page`, `limit` query params), exclude passwordHash
3. `POST /api/users` — create user (admin sets role), hash password, return created user
4. `PUT /api/users/:id` — update name, email, role. Cannot update own role.
5. `DELETE /api/users/:id` — soft delete or hard delete. Cannot delete self.
6. Write tests for every route:
   - Happy path for each CRUD operation
   - Non-admin gets 403
   - Invalid body gets 400 with validation errors
   - Delete self → 400

## Frontend Steps

1. Build `/admin/users` page — paginated table: name, email, role, actions (edit, delete)
2. Build create user modal/form — name, email, password, role dropdown
3. Build edit user modal/form — name, email, role (no password change here)
4. Delete confirmation dialog before deleting
5. Show success/error toast notifications after each action
6. Use React Query for data fetching + cache invalidation after mutations

## Acceptance Criteria
- [ ] Admin can list, create, edit, and delete users
- [ ] Non-admin cannot access user management routes (API + UI)
- [ ] Pagination works correctly
- [ ] All backend tests pass

## Dependencies
- Task 02 complete
