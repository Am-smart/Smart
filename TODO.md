# Project Hardening & Production-Ready Todo List

## Phase 1: Pure Database Agnosticism (Completed)
- [x] Refactor `dbUtils.ts` to standard interface.
- [x] Migrate all direct `supabase` calls from `system.service.ts` to `system.db.ts`.
- [x] Define generic `DatabaseError` class to replace direct `PostgrestError` usage in adapters.
- [x] Replace `any` types in `db-utils.ts` with generic bounded types.

## Phase 2: Security & Session Hardening
- [x] Version-based session cache invalidation.
- [x] Enhanced CSRF protection for session-header requests.
- [ ] Integration of Redis (or similar) for distributed `serverSessionCache`.
- [ ] Implement rate-limiting for all state-changing API endpoints.

## Phase 3: Performance & Scalability
- [x] Chunked batch inserts for notifications (500 records).
- [ ] Implement database-level `INSERT INTO ... SELECT` for global broadcasts to avoid service-layer loops.
- [ ] Add Redis-based rate limiting for anti-cheat logging to replace memory-based logic.

## Phase 4: UI/UX & Reliability
- [x] Unified Loading State enum in `AppContext`.
- [x] Enhanced Sync Conflict reporting to UI via Toasts.
- [ ] Component audit for React Hook dependency warnings (e.g., `useEffect` in `assignments/page.tsx`).
- [ ] Add "Retry Sync" manual action for terminal offline errors.

## Phase 5: Verification & QA
- [x] End-to-end audit report (see AUDIT.md).
- [x] Verified build and linting.
- [ ] Automated integration tests for Role-Based Access Control (RBAC).
