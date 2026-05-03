# Smart LMS - Consolidated Architecture Documentation

## Overview

This project implements a **strict three-layer architecture** with a consolidated design for improved maintainability, scalability, and reusability. It is designed to be database-agnostic through an adapter layer, facilitating future migrations (e.g., to Oracle Cloud).

```
┌─────────────────────────────────────────┐
│  FRONTEND LAYER (Client-Side)           │
│  - Feature-Based Components             │
│  - Next.js Pages (src/app)              │
│  - API Actions (src/lib/api-actions.ts) │
└─────────────────┬───────────────────────┘
                  │
                  │ Standard HTTP (JSON)
                  ↓
┌─────────────────────────────────────────┐
│  API ROUTE LAYER (Control Plane)        │
│  - Consolidated Action-Based Routes     │
│  - Authentication & RBAC/ABAC           │
│  - Request Validation                   │
└─────────────────┬───────────────────────┘
                  │
                  │ Service Orchestration
                  ↓
┌─────────────────────────────────────────┐
│  DOMAIN SERVICE LAYER                   │
│  - Auth, Learning, Assessment, System   │
│  - Business Logic & Invariants          │
└─────────────────┬───────────────────────┘
                  │
                  │ Database Abstraction
                  ↓
┌─────────────────────────────────────────┐
│  DATABASE ADAPTER LAYER                 │
│  - Domain-Grouped Adapters              │
│  - Supabase/PostgreSQL Implementation   │
│  - Extensible for Oracle Cloud          │
└─────────────────────────────────────────┘
```

## Key Architectural Principles

### 1. Frontend - Backend - Database Flow
Data operations must follow the strict flow: UI ➔ API Action ➔ API Route ➔ Service ➔ Database Adapter ➔ Database. Direct database access from frontend components is prohibited.

### 2. Consolidated API Routing
Instead of hundreds of route files, API routes are consolidated by domain (e.g., `/api/system`) and use an `action` parameter to dispatch requests to the appropriate handlers.

### 3. Database Adapters
All database operations are encapsulated in `src/lib/database/`. This layer abstracts the underlying database technology, ensuring the core business logic in services remains decoupled from infrastructure details.

### 4. Feature-Based Components
Components are organized by feature (e.g., `courses`, `assessments`) rather than by user role. They use role-based props and authorization checks to provide dynamic interfaces.

### 5. Unified Sidebar
A single, configurable sidebar (`UnifiedSidebar`) provides consistent navigation across all user roles, driven by a central configuration.

## Layer Details

### Frontend Layer (`src/components/`, `src/app/`)
- **Responsibility:** User interface and client-side logic.
- **Rules:** Must only use `src/lib/api-actions.ts` for data operations. No direct Supabase client usage.

### API Route Layer (`src/app/api/`)
- **Responsibility:** Handling HTTP requests, session validation, and authorization.
- **Rules:** Consolidate routes into action-based handlers. Use `withHandler` utility for standardized error handling and auth.

### Service Layer (`src/lib/services/`)
- **Responsibility:** Business logic orchestration and domain invariant enforcement.
- **Rules:** Grouped into four domains: `AuthService`, `LearningService`, `AssessmentService`, and `SystemService`.

### Database Layer (`src/lib/database/`)
- **Responsibility:** Direct data persistence and retrieval.
- **Rules:** Implemented as domain-grouped objects (e.g., `learningDb`). Uses Supabase RPCs and table queries, but provides a clean interface for services.

## Summary of Consolidation

- **DTOs & Types:** All interfaces and DTOs merged into `src/lib/types.ts`.
- **Services:** Consolidated from 8+ files into 4 domain-based services.
- **Repositories:** Eliminated in favor of domain-based Database Adapters.
- **API Routes:** Drastically reduced file count through action-based grouping.
- **UI:** Unified sidebar and feature-based component organization.
