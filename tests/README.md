# PHA v2 Testing Guide

This directory contains comprehensive tests for the Personal Health Assistant (PHA) v2 platform, focusing on database functionality, constraints, and performance.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the project root with your **test database** credentials:

```bash
# Supabase Test Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
```

⚠️ **Important**: Use a separate test database, not your production database!

### 2. Database Schema Setup

Apply the migration to your test database:

```bash
# Run the migration script in your Supabase SQL editor
cat scripts/migration-final.sql
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run only database tests
npm run test:db

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📁 Test Structure

```
tests/
├── README.md              # This file
├── setup.ts               # Global test configuration
├── utils/
│   └── database.ts        # Database testing utilities
└── database/
    ├── user-profiles.test.ts    # User profiles CRUD tests
    ├── practices.test.ts        # Practices CRUD tests
    ├── children.test.ts         # Children CRUD tests
    └── assessments.test.ts      # Assessments CRUD tests
```

## 🧪 Test Categories

### CRUD Operations

- **CREATE**: Valid data creation, constraint validation, enum validation
- **READ**: Data retrieval, filtering, joins, non-existent record handling
- **UPDATE**: Field updates, constraint enforcement, enum validation
- **DELETE**: Standard deletion, cascade behavior, foreign key constraints

### Constraint Testing

- **Foreign Keys**: Relationship enforcement, cascade behavior
- **Unique Constraints**: Duplicate prevention, case sensitivity
- **NOT NULL**: Required field validation
- **Enums**: Valid value enforcement, invalid value rejection
- **Check Constraints**: Custom validation rules

### Performance Testing

- **Index Efficiency**: Query performance with proper indexing
- **Query Optimization**: Common query patterns under load
- **Bulk Operations**: Large dataset handling

## 🛠 Test Utilities

### DatabaseTestHelper

The `DatabaseTestHelper` class provides utilities for creating test data and automatic cleanup:

```typescript
import { DatabaseTestHelper } from '../utils/database';

describe('My Test Suite', () => {
  let testHelper: DatabaseTestHelper;

  beforeEach(async () => {
    testHelper = new DatabaseTestHelper();
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  it('should create test data', async () => {
    const practice = await testHelper.createTestPractice();
    const userProfile = await testHelper.createTestUserProfile({
      practice_id: practice.id,
    });
    // Test logic here...
  });
});
```

### Test Data Generators

Pre-built generators for consistent test data:

```typescript
import {
  generateTestUserProfile,
  generateTestPractice,
} from '../utils/database';

const userData = generateTestUserProfile({
  email: 'test@example.com',
  role: 'practitioner',
});
```

## 📊 Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## 🔧 Configuration

### Jest Configuration

Tests are configured with:

- **Timeout**: 30 seconds for database operations
- **Environment**: Node.js
- **TypeScript**: Full support with ts-jest
- **Module Mapping**: `@/` alias for `src/` directory

### Environment Variables

Required for all tests:

- `NEXT_PUBLIC_SUPABASE_URL`: Test database URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous key for client operations
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

## 🐛 Troubleshooting

### Common Issues

1. **Missing Environment Variables**

   ```
   Error: Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL
   ```

   **Solution**: Create `.env.local` with your test database credentials

2. **Database Connection Errors**

   ```
   Error: connect ECONNREFUSED
   ```

   **Solution**: Verify your Supabase URL and keys are correct

3. **Schema Errors**

   ```
   Error: relation "user_profiles" does not exist
   ```

   **Solution**: Run the migration script in your test database

4. **Permission Errors**
   ```
   Error: insufficient_privilege
   ```
   **Solution**: Ensure your service role key has proper permissions

### Test Data Cleanup

Tests automatically clean up created data, but if you need manual cleanup:

```sql
-- Reset test database (use with caution!)
TRUNCATE user_profiles, practices, children, assessments CASCADE;
```

## 📈 Performance Benchmarks

Expected performance thresholds:

- **Simple queries**: < 50ms
- **Join queries**: < 100ms
- **Bulk operations**: < 500ms
- **Index scans**: < 25ms

## 🔄 Continuous Integration

Tests are designed to run in CI environments. Ensure your CI has access to a test database and the required environment variables.

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/local-development)
- [TypeScript Testing Best Practices](https://typescript-eslint.io/docs/linting/troubleshooting/)
