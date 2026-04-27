# Smart LMS - Layered Architecture Documentation

## Overview

This project implements a **strict three-layer architecture** that enforces complete separation of concerns:

```
┌─────────────────────────────────────────┐
│  FRONTEND LAYER (Client-Side)           │
│  - React Components (src/components)    │
│  - Next.js Pages (src/app)              │
│  - Client Logic & State Management      │
└─────────────────┬───────────────────────┘
                  │
                  │ API Calls Only
                  ↓
┌─────────────────────────────────────────┐
│  API ROUTE LAYER (Backend/Route Handler)│
│  - Next.js API Routes (src/app/api)     │
│  - Request Validation                   │
│  - Authentication & Authorization       │
│  - Business Logic Orchestration         │
└─────────────────┬───────────────────────┘
                  │
                  │ Service Layer Access
                  ↓
┌─────────────────────────────────────────┐
│  DATABASE LAYER (Data Persistence)      │
│  - Services (src/lib/services)          │
│  - Controllers (src/lib/controllers)    │
│  - Database Models & Queries            │
│  - Data Access Objects (DAOs)           │
└─────────────────────────────────────────┘
```

## Layer Details

### 1. Frontend Layer (`src/` - Components & Pages)

**Responsibility:** User interface and client-side logic

**Files/Directories:**
- `src/components/` - React components
- `src/app/` - Next.js page routes (student, teacher, admin)
- `src/lib/api-actions.ts` - **API calls wrapper** (ONLY way frontend accesses backend)
- `src/lib/api-client.ts` - HTTP client (low-level fetch wrapper)

**Key Rules:**
- ✅ Can import from `api-actions.ts` for API calls
- ✅ Can use local state management (useState, useContext)
- ✅ Can call browser APIs (localStorage, sessionStorage, etc.)
- ❌ **CANNOT directly access database files**
- ❌ **CANNOT import from `src/app/api`**
- ❌ **CANNOT import from `src/lib/services`**
- ❌ **CANNOT import from `src/lib/controllers`**

**Example:**
```typescript
// ✅ CORRECT - Using api-actions
import { getCourses, saveCourse } from '@/lib/api-actions';

const courses = await getCourses();
const result = await saveCourse(courseData);
```

```typescript
// ❌ WRONG - Direct database access
import { courseService } from '@/lib/services/course.service';
const courses = await courseService.getCourses(); // ERROR!
```

### 2. API Route Layer (`src/app/api/` - Route Handlers)

**Responsibility:** HTTP endpoint handling, request validation, authentication

**Files/Directories:**
- `src/app/api/` - All API routes
- Organized by domain: `auth/`, `courses/`, `assignments/`, `system/`, etc.

**Key Rules:**
- ✅ Can import services and controllers
- ✅ Must validate requests
- ✅ Must check authentication/authorization
- ✅ Must return standardized JSON responses
- ✅ Can import from `api-error.ts` for error handling
- ❌ **CANNOT do heavy business logic here**
- ❌ **Cannot query database directly**

**Example - Correct API Route:**
```typescript
// src/app/api/courses/route.ts
import { courseService } from '@/lib/services/course.service';
import { getErrorMessage } from '@/lib/api-error';

export async function GET() {
  try {
    const user = await getSessionUser(); // Auth check
    if (!user) return handleUnauthorized();
    
    const courses = await courseService.getCourses(user.id); // Service call
    return NextResponse.json(courses);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) }, 
      { status: 500 }
    );
  }
}
```

### 3. Database/Service Layer (`src/lib/services/`, `src/lib/controllers/`)

**Responsibility:** Business logic, data access, database operations

**Files/Directories:**
- `src/lib/services/` - Business logic services
- `src/lib/controllers/` - Request orchestration
- `src/lib/api-error.ts` - Error types and helpers

**Key Rules:**
- ✅ Can directly access database
- ✅ Can perform complex business logic
- ✅ Can validate data
- ✅ Should throw typed errors
- ❌ **CANNOT import from frontend components**
- ❌ **CANNOT access browser APIs**
- ❌ **CANNOT make HTTP calls directly**

**Example - Service Layer:**
```typescript
// src/lib/services/course.service.ts
export const courseService = {
  async getCourses(userId: string): Promise<CourseDTO[]> {
    // Business logic & database access
    const courses = await db.query('courses WHERE created_by = ?', [userId]);
    return courses.map(formatCourseDTO);
  }
};
```

## Data Flow Examples

### Example 1: Fetching Courses

```
1. FRONTEND - User clicks "View Courses"
   ↓
2. Component calls: getCourses() from api-actions.ts
   ↓
3. api-actions.ts calls: apiClient.get('/api/courses')
   ↓
4. FRONTEND sends HTTP GET to /api/courses
   ↓
5. API ROUTE - src/app/api/courses/route.ts handles request
   ├─ Validates session/auth
   ├─ Calls courseService.getCourses(userId)
   └─ Returns JSON response
   ↓
6. SERVICE LAYER - courseService.getCourses()
   ├─ Queries database
   ├─ Formats response
   └─ Returns data
   ↓
7. API ROUTE sends response back
   ↓
8. FRONTEND receives data in getCourses() callback
   ↓
9. Component state updates and re-renders
```

### Example 2: Saving a Course

```
User submits form
    ↓
Component: saveCourse(courseData)
    ↓
api-actions.ts: apiClient.post('/api/courses', courseData)
    ↓
API Route validates + calls courseService.saveCourse()
    ↓
Service: validates, saves to DB, returns saved object
    ↓
API Route: returns JSON response
    ↓
Component receives result and updates UI
```

## Enforcement Mechanisms

### 1. Import Path Restrictions

Using TypeScript and eslint, enforce:
- Frontend files only import from `api-actions`
- Services only imported from API routes
- No cross-layer imports

### 2. API-Only Communication

All data flows through HTTP:
- Frontend ← API Routes → Services/Database
- No direct service imports in components

### 3. Type Safety

- All API responses use DTOs
- Error handling via `ApiError` type
- TypeScript strict mode enforces typing

## File Organization

```
src/
├── app/
│   ├── api/                          # API Routes ONLY
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── assignments/
│   │   ├── system/
│   │   └── api-utils.ts              # Auth helpers for routes
│   ├── student/                      # Frontend pages
│   ├── teacher/
│   ├── admin/
│   └── layout.tsx
├── components/                       # React components
│   ├── StudentHeader.tsx             # Can only use api-actions
│   ├── TeacherHeader.tsx
│   └── admin/
├── lib/
│   ├── api-client.ts                 # HTTP client (use in api-actions)
│   ├── api-actions.ts                # ✅ FRONTEND uses this
│   ├── api-error.ts                  # Error types
│   ├── services/                     # ❌ FRONTEND cannot use
│   │   ├── course.service.ts
│   │   ├── auth.service.ts
│   │   └── ...
│   ├── controllers/                  # ❌ FRONTEND cannot use
│   │   ├── auth.controller.ts
│   │   └── ...
│   ├── dto/                          # Data Transfer Objects
│   ├── types.ts                      # Frontend types only
│   └── validation.ts
```

## Database Access Pattern

```
                FRONTEND (Browser)
                        ↓
                   api-actions.ts
                        ↓
                    HTTP Request
                        ↓
                   API Route Handler
                    /api/courses
                        ↓
            courseService.getCourses()
                        ↓
                  Database Query
                (Actual DB Access)
                        ↓
                   JSON Response
                        ↓
                        HTTP
                        ↓
                   Frontend receives
                   & updates state
```

## Summary

✅ **Enforced:** 
- Frontend ONLY uses `api-actions.ts`
- API routes handle HTTP and auth
- Services contain all business logic
- Database access ONLY through services
- No direct frontend-to-database access

This architecture ensures:
1. **Security** - Authentication and authorization at API layer
2. **Maintainability** - Clear separation of concerns
3. **Scalability** - Easy to add features without breaking layers
4. **Testability** - Each layer can be tested independently
5. **Type Safety** - DTOs and TypeScript types enforce contracts
