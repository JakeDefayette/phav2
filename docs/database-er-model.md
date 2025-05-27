# Database Entity-Relationship Model

## Pediatric Health Assessment Platform

### Overview

This document defines the comprehensive entity-relationship model for the PHA platform, incorporating the migration from step-based assessment data to a normalized survey_responses pattern and implementing all missing tables for viral tracking, email analytics, and comprehensive reporting.

## Core Entities

### 1. user_profiles

**Purpose**: User authentication and profile management

```sql
user_profiles {
  id: uuid (PK, references auth.users.id)
  email: varchar(255) NOT NULL UNIQUE
  first_name: varchar(100)
  last_name: varchar(100)
  role: user_role_enum NOT NULL DEFAULT 'parent'
  practice_id: uuid (FK -> practices.id)
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 2. practices

**Purpose**: Healthcare practice management with integrated branding

```sql
practices {
  id: uuid (PK, DEFAULT gen_random_uuid())
  name: varchar(255) NOT NULL
  address: text
  phone: varchar(20)
  email: varchar(255)
  website: varchar(255)
  logo_url: varchar(500)
  primary_color: varchar(7) DEFAULT '#3B82F6'
  secondary_color: varchar(7) DEFAULT '#EF4444'
  subscription_tier: subscription_tier_enum DEFAULT 'basic'
  is_active: boolean DEFAULT true
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 3. children

**Purpose**: Child profiles linked to parent users

```sql
children {
  id: uuid (PK, DEFAULT gen_random_uuid())
  parent_id: uuid (FK -> user_profiles.id) NOT NULL
  first_name: varchar(100) NOT NULL
  last_name: varchar(100) NOT NULL
  date_of_birth: date NOT NULL
  gender: gender_enum
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 4. assessments

**Purpose**: Assessment sessions (migrated from step-based to survey_responses)

```sql
assessments {
  id: uuid (PK, DEFAULT gen_random_uuid())
  child_id: uuid (FK -> children.id) NOT NULL
  practice_id: uuid (FK -> practices.id) NOT NULL
  status: assessment_status_enum DEFAULT 'in_progress'
  brain_o_meter_score: integer
  started_at: timestamptz DEFAULT now()
  completed_at: timestamptz
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 5. survey_question_definitions

**Purpose**: Dynamic survey configuration (NEW)

```sql
survey_question_definitions {
  id: uuid (PK, DEFAULT gen_random_uuid())
  question_key: varchar(100) NOT NULL UNIQUE
  question_text: text NOT NULL
  question_type: question_type_enum NOT NULL
  options: jsonb
  step_number: integer NOT NULL
  order_within_step: integer NOT NULL
  is_required: boolean DEFAULT true
  validation_rules: jsonb
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 6. survey_responses

**Purpose**: Normalized survey responses (REPLACES step\_\*\_data)

```sql
survey_responses {
  id: uuid (PK, DEFAULT gen_random_uuid())
  assessment_id: uuid (FK -> assessments.id) NOT NULL
  question_id: uuid (FK -> survey_question_definitions.id) NOT NULL
  response_value: text
  response_data: jsonb
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 7. reports

**Purpose**: Generated assessment reports

```sql
reports {
  id: uuid (PK, DEFAULT gen_random_uuid())
  assessment_id: uuid (FK -> assessments.id) NOT NULL
  report_data: jsonb NOT NULL
  share_token: varchar(255) UNIQUE
  is_shared: boolean DEFAULT false
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 8. report_shares

**Purpose**: Viral tracking and referral analytics (NEW)

```sql
report_shares {
  id: uuid (PK, DEFAULT gen_random_uuid())
  report_id: uuid (FK -> reports.id) NOT NULL
  shared_by_user_id: uuid (FK -> user_profiles.id)
  shared_via: share_method_enum NOT NULL
  recipient_email: varchar(255)
  recipient_phone: varchar(20)
  share_token: varchar(255) NOT NULL
  viewed_at: timestamptz
  converted_to_assessment: boolean DEFAULT false
  referral_practice_id: uuid (FK -> practices.id)
  created_at: timestamptz DEFAULT now()
}
```

### 9. email_templates

**Purpose**: Email template management (NEW)

```sql
email_templates {
  id: uuid (PK, DEFAULT gen_random_uuid())
  name: varchar(255) NOT NULL
  subject: varchar(255) NOT NULL
  html_content: text NOT NULL
  text_content: text
  template_type: email_template_type_enum NOT NULL
  practice_id: uuid (FK -> practices.id)
  is_active: boolean DEFAULT true
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 10. email_campaigns

**Purpose**: Email campaign management

```sql
email_campaigns {
  id: uuid (PK, DEFAULT gen_random_uuid())
  practice_id: uuid (FK -> practices.id) NOT NULL
  template_id: uuid (FK -> email_templates.id)
  name: varchar(255) NOT NULL
  subject: varchar(255) NOT NULL
  content: text NOT NULL
  status: campaign_status_enum DEFAULT 'draft'
  scheduled_at: timestamptz
  sent_at: timestamptz
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 11. email_subscribers

**Purpose**: Email subscription management

```sql
email_subscribers {
  id: uuid (PK, DEFAULT gen_random_uuid())
  email: varchar(255) NOT NULL
  practice_id: uuid (FK -> practices.id) NOT NULL
  first_name: varchar(100)
  last_name: varchar(100)
  is_subscribed: boolean DEFAULT true
  subscription_source: subscription_source_enum
  subscribed_at: timestamptz DEFAULT now()
  unsubscribed_at: timestamptz
  created_at: timestamptz DEFAULT now()
  updated_at: timestamptz DEFAULT now()
}
```

### 12. email_sends

**Purpose**: Detailed email delivery tracking (NEW)

```sql
email_sends {
  id: uuid (PK, DEFAULT gen_random_uuid())
  campaign_id: uuid (FK -> email_campaigns.id)
  template_id: uuid (FK -> email_templates.id)
  subscriber_id: uuid (FK -> email_subscribers.id)
  recipient_email: varchar(255) NOT NULL
  status: email_status_enum DEFAULT 'pending'
  sent_at: timestamptz
  delivered_at: timestamptz
  opened_at: timestamptz
  clicked_at: timestamptz
  bounced_at: timestamptz
  bounce_reason: text
  unsubscribed_at: timestamptz
  created_at: timestamptz DEFAULT now()
}
```

### 13. practice_analytics

**Purpose**: Comprehensive analytics and reporting (NEW)

```sql
practice_analytics {
  id: uuid (PK, DEFAULT gen_random_uuid())
  practice_id: uuid (FK -> practices.id) NOT NULL
  metric_type: analytics_metric_enum NOT NULL
  metric_value: numeric NOT NULL
  metric_data: jsonb
  period_start: timestamptz NOT NULL
  period_end: timestamptz NOT NULL
  created_at: timestamptz DEFAULT now()
}
```

## Enums

```sql
-- User roles
CREATE TYPE user_role_enum AS ENUM ('parent', 'practitioner', 'admin');

-- Subscription tiers
CREATE TYPE subscription_tier_enum AS ENUM ('basic', 'premium', 'enterprise');

-- Gender options
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- Assessment status
CREATE TYPE assessment_status_enum AS ENUM ('in_progress', 'completed', 'abandoned');

-- Question types
CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'text', 'number', 'boolean', 'scale', 'date');

-- Share methods
CREATE TYPE share_method_enum AS ENUM ('email', 'sms', 'social', 'direct_link');

-- Email template types
CREATE TYPE email_template_type_enum AS ENUM ('welcome', 'assessment_complete', 'report_share', 'campaign', 'reminder');

-- Campaign status
CREATE TYPE campaign_status_enum AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');

-- Subscription sources
CREATE TYPE subscription_source_enum AS ENUM ('website', 'assessment', 'referral', 'import');

-- Email status
CREATE TYPE email_status_enum AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- Analytics metrics
CREATE TYPE analytics_metric_enum AS ENUM ('assessments_completed', 'reports_generated', 'reports_shared', 'email_opens', 'email_clicks', 'referrals_generated', 'conversion_rate');
```

## Relationships

### Primary Relationships

1. **user_profiles** ↔ **practices** (Many-to-One)
2. **children** ↔ **user_profiles** (Many-to-One)
3. **assessments** ↔ **children** (Many-to-One)
4. **assessments** ↔ **practices** (Many-to-One)
5. **survey_responses** ↔ **assessments** (Many-to-One)
6. **survey_responses** ↔ **survey_question_definitions** (Many-to-One)
7. **reports** ↔ **assessments** (One-to-One)

### Viral & Tracking Relationships

8. **report_shares** ↔ **reports** (Many-to-One)
9. **report_shares** ↔ **user_profiles** (Many-to-One)
10. **report_shares** ↔ **practices** (Many-to-One, referral tracking)

### Email System Relationships

11. **email_templates** ↔ **practices** (Many-to-One)
12. **email_campaigns** ↔ **practices** (Many-to-One)
13. **email_campaigns** ↔ **email_templates** (Many-to-One)
14. **email_subscribers** ↔ **practices** (Many-to-One)
15. **email_sends** ↔ **email_campaigns** (Many-to-One)
16. **email_sends** ↔ **email_templates** (Many-to-One)
17. **email_sends** ↔ **email_subscribers** (Many-to-One)

### Analytics Relationships

18. **practice_analytics** ↔ **practices** (Many-to-One)

## Constraints & Indexes

### Primary Keys

- All tables use UUID primary keys with `gen_random_uuid()` default
- `user_profiles.id` references `auth.users.id` (Supabase Auth)

### Foreign Key Constraints

```sql
-- Core relationships
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_practice
  FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE SET NULL;

ALTER TABLE children ADD CONSTRAINT fk_child_parent
  FOREIGN KEY (parent_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE assessments ADD CONSTRAINT fk_assessment_child
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE assessments ADD CONSTRAINT fk_assessment_practice
  FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;

-- Survey system
ALTER TABLE survey_responses ADD CONSTRAINT fk_response_assessment
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE survey_responses ADD CONSTRAINT fk_response_question
  FOREIGN KEY (question_id) REFERENCES survey_question_definitions(id) ON DELETE CASCADE;

-- Reports and sharing
ALTER TABLE reports ADD CONSTRAINT fk_report_assessment
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE report_shares ADD CONSTRAINT fk_share_report
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

-- Email system constraints
ALTER TABLE email_templates ADD CONSTRAINT fk_template_practice
  FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;

ALTER TABLE email_campaigns ADD CONSTRAINT fk_campaign_practice
  FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;

ALTER TABLE email_sends ADD CONSTRAINT fk_send_campaign
  FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE;

-- Analytics
ALTER TABLE practice_analytics ADD CONSTRAINT fk_analytics_practice
  FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;
```

### Unique Constraints

```sql
-- Prevent duplicate survey responses
ALTER TABLE survey_responses ADD CONSTRAINT uk_assessment_question
  UNIQUE (assessment_id, question_id);

-- Unique share tokens
ALTER TABLE reports ADD CONSTRAINT uk_report_share_token
  UNIQUE (share_token);

ALTER TABLE report_shares ADD CONSTRAINT uk_share_token
  UNIQUE (share_token);

-- Unique email subscribers per practice
ALTER TABLE email_subscribers ADD CONSTRAINT uk_practice_email
  UNIQUE (practice_id, email);

-- Unique question keys
ALTER TABLE survey_question_definitions ADD CONSTRAINT uk_question_key
  UNIQUE (question_key);
```

### Performance Indexes

```sql
-- Assessment queries
CREATE INDEX idx_assessments_child_id ON assessments(child_id);
CREATE INDEX idx_assessments_practice_id ON assessments(practice_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);

-- Survey responses
CREATE INDEX idx_survey_responses_assessment_id ON survey_responses(assessment_id);
CREATE INDEX idx_survey_responses_question_id ON survey_responses(question_id);

-- Report sharing
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX idx_report_shares_shared_by ON report_shares(shared_by_user_id);
CREATE INDEX idx_report_shares_token ON report_shares(share_token);

-- Email tracking
CREATE INDEX idx_email_sends_campaign_id ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_recipient ON email_sends(recipient_email);

-- Analytics
CREATE INDEX idx_practice_analytics_practice_id ON practice_analytics(practice_id);
CREATE INDEX idx_practice_analytics_metric_type ON practice_analytics(metric_type);
CREATE INDEX idx_practice_analytics_period ON practice_analytics(period_start, period_end);
```

## Migration Strategy

### Phase 1: Core Schema Updates

1. Create new enums and survey_question_definitions table
2. Create survey_responses table
3. Migrate existing step\_\*\_data to survey_responses

### Phase 2: Viral & Analytics Tables

1. Create report_shares table
2. Create practice_analytics table
3. Implement tracking triggers

### Phase 3: Enhanced Email System

1. Create email_templates table
2. Create email_sends table
3. Update email_campaigns relationships

### Phase 4: Data Migration

1. Preserve existing assessment data during migration
2. Create backward compatibility views
3. Update application code to use new schema

## Database Functions

### Existing Functions (to be preserved)

- `calculate_brain_o_meter_score(assessment_id uuid)`
- `generate_share_token()`
- `get_practice_stats(practice_id uuid)`

### New Functions (to be implemented)

- `migrate_step_data_to_responses(assessment_id uuid)`
- `track_report_share(report_id uuid, share_method text, recipient text)`
- `calculate_analytics_metrics(practice_id uuid, metric_type text, period_start timestamptz, period_end timestamptz)`
- `get_viral_tracking_stats(practice_id uuid)`
