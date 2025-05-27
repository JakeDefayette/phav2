# Service Layer Architecture

This document describes the modular data access layer implemented for the PHA-v2 application. The service layer provides a clean abstraction over database operations and implements business logic for the pediatric health assessment platform.

## Architecture Overview

### Base Service Pattern

All services extend the `BaseService` class which provides:

- **Common CRUD operations** (create, read, update, delete)
- **Consistent error handling** with `ServiceError` class
- **Type safety** with TypeScript generics
- **Standardized query patterns** with filtering and sorting
- **Pagination support** for large datasets

### Service Structure

```
src/services/
├── base.ts              # Base service class and error handling
├── auth.ts              # Authentication service (existing)
├── practices.ts         # Practice management
├── children.ts          # Child profile management
├── assessments.ts       # Assessment lifecycle management
├── surveyResponses.ts   # Survey response handling
├── reports.ts           # Report generation and viral tracking
└── index.ts             # Service exports and aggregation
```

## Core Services

### 1. BaseService (`base.ts`)

**Purpose**: Provides common functionality for all data access services.

**Key Features**:

- Generic CRUD operations
- Consistent error handling with `ServiceError`
- Query building with filters and sorting
- Pagination support
- Type-safe operations

**Usage Example**:

```typescript
import { BaseService, ServiceError } from '@/services/base';

class MyService extends BaseService<MyType, MyInsert, MyUpdate> {
  constructor() {
    super('my_table');
  }

  async customOperation() {
    try {
      return await this.findAll({ status: 'active' });
    } catch (error) {
      this.handleError(error, 'Custom operation');
    }
  }
}
```

### 2. PracticesService (`practices.ts`)

**Purpose**: Manages practice information, subscription tiers, and branding.

**Key Operations**:

- Practice CRUD operations
- Subscription management
- Branding configuration (logos, colors, custom CSS)
- Practice statistics and analytics
- User association management

**Business Logic**:

- Subscription tier validation
- Custom domain management
- Practice settings configuration

### 3. ChildrenService (`children.ts`)

**Purpose**: Manages child profiles and their relationships to parents.

**Key Operations**:

- Child profile management
- Age calculation utilities
- Assessment history tracking
- Parent-child relationship management
- Practice-based child queries (for practitioners)

**Business Logic**:

- Age-based filtering and grouping
- Assessment count tracking
- Recent activity monitoring

### 4. AssessmentsService (`assessments.ts`)

**Purpose**: Manages the assessment lifecycle from creation to completion.

**Key Operations**:

- Assessment creation and management
- Status tracking (draft, in_progress, completed, abandoned)
- Brain-o-meter score calculation
- Assessment statistics and analytics
- Assessment-response relationships

**Business Logic**:

- Assessment workflow management
- Completion tracking
- Performance metrics calculation
- Practice-level analytics

### 5. SurveyResponsesService (`surveyResponses.ts`)

**Purpose**: Handles survey responses and implements the normalized response pattern.

**Key Operations**:

- Response saving and updating (upsert pattern)
- Response retrieval by assessment
- Category-based response grouping
- Brain-o-meter score calculation
- Response analytics and summaries

**Business Logic**:

- Response validation and normalization
- Scoring algorithm implementation
- Category-based analysis
- Response pattern detection

### 6. ReportsService (`reports.ts`)

**Purpose**: Generates reports and implements viral tracking functionality.

**Key Operations**:

- Report generation (standard, detailed, summary)
- Report sharing with unique tokens
- Viral tracking and analytics
- Conversion tracking
- Share expiration management

**Business Logic**:

- Dynamic report content generation
- Share token management
- Viral metrics calculation
- Conversion attribution

## Data Flow Patterns

### 1. Assessment Workflow

```
1. Create Assessment (AssessmentsService)
   ↓
2. Save Responses (SurveyResponsesService)
   ↓
3. Calculate Score (SurveyResponsesService)
   ↓
4. Complete Assessment (AssessmentsService)
   ↓
5. Generate Report (ReportsService)
   ↓
6. Share Report (ReportsService)
```

### 2. Viral Tracking Flow

```
1. Generate Report → Create share token
   ↓
2. Share Report → Track share method
   ↓
3. View Report → Mark as viewed
   ↓
4. Convert → Record conversion assessment
   ↓
5. Analytics → Calculate viral metrics
```

## Error Handling

### ServiceError Class

All services use the `ServiceError` class for consistent error handling:

```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
```

### Error Patterns

- **Database errors** are caught and converted to ServiceError
- **Validation errors** include specific error codes
- **Not found errors** return null instead of throwing
- **Business logic errors** include contextual details

## Type Safety

### Interface Patterns

Each service defines three main interfaces:

- **Base type**: Complete entity with all fields
- **Insert type**: Fields required for creation
- **Update type**: Optional fields for updates

Example:

```typescript
export interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  // ... all fields
}

export interface ChildInsert {
  parent_id: string;
  first_name: string;
  // ... required fields only
}

export interface ChildUpdate {
  first_name?: string;
  // ... optional fields only
}
```

## Performance Considerations

### Query Optimization

- **Selective field loading** using Supabase select syntax
- **Relationship loading** with join syntax
- **Index-aware queries** following database schema
- **Pagination** for large result sets

### Caching Strategy

Services are designed to support caching at the application level:

- Singleton service instances
- Consistent query patterns
- Predictable data structures

## Security Implementation

### Row Level Security (RLS)

Services rely on database-level RLS policies:

- **User isolation**: Users can only access their own data
- **Practice isolation**: Practitioners can only access their practice data
- **Role-based access**: Different permissions for parents vs practitioners

### Data Validation

- **Type checking** at the TypeScript level
- **Business rule validation** in service methods
- **Input sanitization** through Supabase client

## Usage Examples

### Basic CRUD Operations

```typescript
import { childrenService } from '@/services';

// Create a child
const child = await childrenService.create({
  parent_id: 'user-123',
  first_name: 'John',
  date_of_birth: '2020-01-01',
});

// Find children by parent
const children = await childrenService.findByParentId('user-123');

// Update a child
const updated = await childrenService.update(child.id, {
  last_name: 'Doe',
});
```

### Complex Operations

```typescript
import {
  assessmentsService,
  surveyResponsesService,
  reportsService,
} from '@/services';

// Complete assessment workflow
const assessment = await assessmentsService.startAssessment('child-123');

await surveyResponsesService.saveResponse(
  assessment.id,
  'question-1',
  5,
  'Excellent development'
);

const score = await surveyResponsesService.calculateBrainOMeterScore(
  assessment.id
);
await assessmentsService.completeAssessment(assessment.id, score);

const report = await reportsService.generateReport(assessment.id, 'detailed');
const share = await reportsService.createShare({
  report_id: report.id,
  share_method: 'email',
  recipient_email: 'parent@example.com',
});
```

## Migration from Legacy Schema

The service layer is designed to work with the new normalized schema while maintaining compatibility during migration:

### Key Changes

- **Step-based data** → **Normalized survey_responses**
- **Embedded JSON** → **Relational structure**
- **Limited sharing** → **Comprehensive viral tracking**
- **Basic reports** → **Dynamic report generation**

### Migration Strategy

1. Deploy new schema alongside existing
2. Update services to use new tables
3. Migrate existing data using service layer
4. Remove legacy table dependencies
5. Update frontend to use new service APIs

## Testing Strategy

### Unit Testing

- Mock Supabase client for isolated testing
- Test business logic independently
- Validate error handling paths

### Integration Testing

- Test with actual database connections
- Validate RLS policy enforcement
- Test complex query relationships

### Performance Testing

- Load test with realistic data volumes
- Monitor query performance
- Validate caching effectiveness

## Future Enhancements

### Planned Features

- **Caching layer** with Redis integration
- **Event sourcing** for audit trails
- **Background jobs** for report generation
- **Real-time subscriptions** for live updates
- **API rate limiting** for external access

### Scalability Considerations

- **Connection pooling** for high concurrency
- **Read replicas** for analytics queries
- **Horizontal scaling** with service separation
- **Microservice migration** path

---

This service layer provides a robust foundation for the PHA-v2 application, implementing best practices for data access, error handling, and business logic encapsulation while maintaining type safety and performance.
