# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PHA-v2 is a **Chiropractic Practice Growth Platform** - a Next.js application for pediatric health assessments, practice management, and viral report sharing. The platform enables chiropractors to create branded health assessments that parents can share, driving practice growth through viral marketing.

## Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Production build
npm run start              # Start production server

# Quality & Testing
npm run lint               # Run ESLint
npm run test:db            # Run database tests (sequential execution)
npm run test:coverage      # Generate test coverage reports
npm run code-quality       # Combined lint, format, and type check

# Database
npm run db:migrate         # Run database migrations
npm run db:seed            # Seed survey questions
```

## Architecture Overview

### Feature-Based Structure

The codebase follows a feature-based architecture:

- `src/features/assessment/` - Multi-step survey workflow with progress tracking
- `src/features/dashboard/` - Practice and child management
- `src/features/reports/` - Report generation, visualization, and viral sharing
- `src/shared/` - Shared components, services, and utilities using atomic design

### Key Architectural Patterns

**Service Layer Pattern**: All data operations go through service classes extending `BaseService` with standardized error handling and database transactions.

**Feature-Based Organization**

**Authentication Flow**: Supabase Auth with JWT tokens, role-based access (Chiropractor/Parent), and Row Level Security policies.

**Survey Workflow**: Multi-step forms with Formik validation, progress persistence, and resume capability via `SurveyDataMapper`.

**Report Generation**: Assessment completion triggers chart visualization, PDF generation with practice branding, and token-based viral sharing.

## Database Architecture

The application uses Supabase with a 13-table schema featuring:

- UUID primary keys for scalability
- JSONB storage for flexible survey responses
- 11 custom enums for data integrity
- Comprehensive RLS policies for data isolation
- 3-phase migration system (enums → tables → functions)

**Critical**: Database tests must run sequentially (`npm run test:db`) due to transaction isolation requirements.

## Development Workflow

### Error Handling Standards

- Use `ServiceError` class for consistent API error responses
- Implement validation at API boundaries with type checking
- Include error boundaries in React components for fault tolerance

### Testing Requirements

- Coverage goals: Statements >90%, Branches >85%, Functions >90%
- Use test utilities in `tests/utils/database.ts` for data generation
- Include accessibility testing with jest-axe for component tests

### Component Development

- Follow atomic design principles with clear prop interfaces
- Implement loading states and user feedback patterns
- Use composition over inheritance for component reusability

## Configuration

Environment variables are validated through `src/shared/config/index.ts` with Zod schemas:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations
- `RESEND_API_KEY` - Email functionality
- `NEXT_PUBLIC_BASE_URL` - Application base URL

## Security Considerations

- All routes protected by middleware with session validation
- RLS policies enforce data isolation between practices
- Public report sharing uses secure token-based access
- HTTPS enforcement and security headers configured in Vercel

## Performance Notes

- Connection monitoring with automatic retry logic for database operations
- Component lazy loading and code splitting implemented
- Caching strategies for reports and chart data
- Memoization utilities available in `src/shared/utils/memoization.ts`

## Key Integration Points

**Real-time Features**: Supabase real-time subscriptions for progress tracking and report updates.

**Chart Generation**: Multiple chart types (Bar, Line, Pie, Radar) using Chart.js and Recharts.

**PDF Generation**: `@react-pdf/renderer` for branded report downloads.

**Task Management**: Integration with Task Master AI MCP server for development workflow.
