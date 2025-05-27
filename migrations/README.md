# Database Migrations for PHA-v2

This directory contains the database migration files for the Pediatric Health Assessment platform v2. The migrations implement a comprehensive schema with survey system, viral tracking, email marketing, and analytics capabilities.

## Migration Overview

### Migration Files

1. **`001_create_enums.sql`** - Custom enum types
2. **`002_create_core_tables.sql`** - Core tables with relationships
3. **`003_create_functions_triggers.sql`** - Functions, triggers, and RLS policies

### Schema Architecture

#### Core Entities (13 Tables)

- `user_profiles` - User authentication and profiles
- `practices` - Practice information with branding
- `children` - Child profiles linked to parents
- `survey_question_definitions` - Dynamic survey configuration
- `assessments` - Assessment sessions
- `survey_responses` - Normalized survey data (replaces step\_\*\_data)
- `reports` - Generated assessment reports
- `report_shares` - Viral tracking system
- `email_templates` - Email template management
- `email_campaigns` - Email marketing campaigns
- `email_subscribers` - Subscription management
- `email_sends` - Detailed email tracking
- `practice_analytics` - Analytics and metrics

#### Custom Types (11 Enums)

- `user_role_enum` - User roles (parent, practitioner, admin)
- `subscription_tier_enum` - Practice subscription levels
- `gender_enum` - Gender options for children
- `assessment_status_enum` - Assessment completion status
- `question_type_enum` - Survey question types
- `share_method_enum` - Report sharing methods
- `email_template_type_enum` - Email template categories
- `campaign_status_enum` - Email campaign status
- `subscription_source_enum` - Email subscription sources
- `email_status_enum` - Email delivery status
- `analytics_metric_enum` - Analytics metric types

## Running Migrations

### Option 1: Using the Migration Runner Script (Recommended)

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run migrations
node scripts/run-migrations.js
```

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Option 3: Manual Execution

Execute the SQL files in order through the Supabase dashboard:

1. Copy the contents of `001_create_enums.sql`
2. Paste and execute in Supabase SQL Editor
3. Repeat for `002_create_core_tables.sql`
4. Repeat for `003_create_functions_triggers.sql`

## Key Features Implemented

### 🔄 Survey System Migration

- **From**: Step-based JSON data (`step_1_data`, `step_2_data`, `step_3_data`)
- **To**: Normalized `survey_responses` table with `survey_question_definitions`
- **Benefits**: Better data integrity, flexible querying, analytics capabilities

### 🚀 Viral Tracking System

- Complete `report_shares` table for tracking shared reports
- Conversion tracking from shares to new assessments
- Support for multiple sharing methods (email, SMS, social, direct link)
- Analytics on viral growth and referral effectiveness

### 📧 Enhanced Email System

- **Templates**: Reusable email templates with variable substitution
- **Campaigns**: Full email marketing campaign management
- **Subscribers**: Subscription management with source tracking
- **Tracking**: Detailed delivery, open, click, and bounce tracking

### 📊 Analytics Infrastructure

- Time-based metrics (daily, weekly, monthly, yearly)
- Predefined metric types for consistent reporting
- Practice-specific analytics with metadata support
- Real-time statistics calculation functions

### 🔒 Security & Access Control

- **Row Level Security (RLS)** enabled on all tables
- **Role-based policies** for parents, practitioners, and admins
- **Practice isolation** - users only see data from their practice
- **Secure sharing** - token-based public report access

### ⚡ Performance Optimizations

- **40+ Strategic Indexes** for common query patterns
- **UUID Primary Keys** for scalability
- **Timestamptz Fields** for proper timezone handling
- **JSONB Storage** for flexible data structures

### 🤖 Business Logic Automation

- **Auto-generated share tokens** for viral tracking
- **Brain-O-Meter scoring** calculated on assessment completion
- **Practice statistics** updated in real-time
- **Timestamp management** automated via triggers

## Database Functions

### Utility Functions

- `update_updated_at_column()` - Automatic timestamp updates
- `generate_share_token()` - Secure token generation
- `calculate_brain_o_meter_score(uuid)` - Assessment scoring
- `get_practice_stats(uuid)` - Real-time practice analytics

### Automated Triggers

- **Timestamp triggers** on all tables with `updated_at` fields
- **Share token generation** when reports are made public
- **Brain-O-Meter calculation** when assessments are completed

## Row Level Security Policies

### User Access Patterns

- **Parents**: Can manage their own children and assessments
- **Practitioners**: Can view all data within their practice
- **Admins**: Can modify survey question definitions

### Data Isolation

- Practice-based data segregation
- User-specific data access
- Secure public sharing for reports

## Migration Strategy

### Phase 1: Foundation (001_create_enums.sql)

- Establish all custom enum types
- Ensure data integrity constraints

### Phase 2: Core Schema (002_create_core_tables.sql)

- Create all tables with relationships
- Implement indexes for performance
- Add comprehensive documentation

### Phase 3: Business Logic (003_create_functions_triggers.sql)

- Add utility functions
- Implement automated triggers
- Enable security policies

## Post-Migration Steps

### 1. Update TypeScript Types

```bash
# Generate new types from the updated schema
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### 2. Implement Service Layer

- Create CRUD services following `src/services/auth.ts` patterns
- Implement business logic services
- Add proper error handling and validation

### 3. Data Migration (if upgrading)

- Create migration scripts to move existing step-based data to survey_responses
- Implement backward compatibility during transition
- Test data integrity after migration

### 4. Testing

- Test all CRUD operations
- Validate constraint enforcement
- Verify RLS policies
- Performance test common query patterns

## Troubleshooting

### Common Issues

1. **Permission Errors**

   - Ensure you're using the service role key, not the anon key
   - Check that your user has the necessary database permissions

2. **Migration Failures**

   - Run migrations in the correct order (001, 002, 003)
   - Check for existing tables/types that might conflict
   - Review error messages in Supabase dashboard

3. **RLS Policy Issues**
   - Verify user authentication is working
   - Check that user roles are properly set
   - Test policies with different user types

### Getting Help

- Check the Supabase dashboard for detailed error messages
- Review the migration logs for specific failure points
- Ensure all environment variables are correctly set
- Verify database connection and permissions

## Schema Validation

After running migrations, verify the schema:

```sql
-- Check that all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check that all enums exist
SELECT typname FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

## Next Steps

1. **Service Layer Implementation** - Build comprehensive CRUD services
2. **Frontend Integration** - Update components to use new schema
3. **Testing Suite** - Implement comprehensive database tests
4. **Performance Monitoring** - Set up query performance tracking
5. **Analytics Dashboard** - Build reporting interface using new analytics tables
