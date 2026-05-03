# Smart LMS

A modern, scalable Learning Management System built with Next.js, Supabase, and a consolidated architecture.

## Architecture

This project follows a strict three-layer architecture designed for maintainability and ease of database migration.

- **Frontend:** React + Next.js (App Router)
- **API:** Next.js Route Handlers (Consolidated & Action-based)
- **Services:** Domain-driven business logic
- **Database:** Abstracted Adapters (Supabase/PostgreSQL)

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

## Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Set up environment variables in `.env.local` (Supabase URL, Anon Key, Redis URL/Token).
4.  Run the development server: `npm run dev`

## Key Features

- **Role-Based Access Control:** Admin, Teacher, and Student roles.
- **Course Management:** Lessons, materials, and discussion boards.
- **Assessments:** Assignments and Quizzes with automatic/manual grading.
- **Anti-Cheat:** Integrated violation tracking for assessments.
- **Offline Support:** Basic offline sync capabilities.
- **Unified UI:** Role-configurable sidebar and feature-based component design.
