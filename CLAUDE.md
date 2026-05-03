# Smart LMS - Developer Guide

## Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint checks

## Project Structure
- `src/app/`: Next.js pages and API routes
- `src/components/`: Feature-based React components
- `src/lib/database/`: Database adapters (Replaceable layer)
- `src/lib/services/`: Domain services (Business logic)
- `src/lib/api-actions.ts`: Main entry point for frontend API calls
- `src/lib/types.ts`: Shared TypeScript interfaces and DTOs

## Coding Standards
- **Imports:** Always use `@/` alias for absolute imports.
- **Layers:** Follow the Frontend ➔ API ➔ Service ➔ Database flow.
- **Components:** Group components by feature under `src/components/`.
- **API:** Group related API operations into action-based routes.
- **Database:** Ensure all DB operations are in `src/lib/database/`.

## Key Files
- `src/lib/types.ts`: Source of truth for data models.
- `src/lib/api-actions.ts`: Sole communication channel for the UI.
- `src/components/common/UnifiedSidebar.tsx`: Configurable sidebar for all roles.
