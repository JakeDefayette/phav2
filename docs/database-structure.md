# Chiropractic Practice Growth Platform - Database Schema

## Core Tables

### practices

```sql
id (UUID, Primary Key)
name (VARCHAR, NOT NULL)
email (VARCHAR, UNIQUE, NOT NULL)
password_hash (VARCHAR, NOT NULL)
phone (VARCHAR)
address (TEXT)
website (VARCHAR)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
subscription_status (ENUM: 'trial', 'active', 'cancelled', 'past_due')
subscription_plan (VARCHAR)
stripe_customer_id (VARCHAR)
```

### practice_branding

```sql
id (UUID, Primary Key)
practice_id (UUID, Foreign Key → practices.id)
logo_url (VARCHAR)
primary_color (VARCHAR) -- hex color code
secondary_color (VARCHAR) -- hex color code
landing_page_video_url (VARCHAR)
custom_welcome_message (TEXT)
contact_display_name (VARCHAR)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### assessments

```sql
id (UUID, Primary Key)
practice_id (UUID, Foreign Key → practices.id)
parent_email (VARCHAR, NOT NULL)
parent_name (VARCHAR, NOT NULL)
parent_phone (VARCHAR)
consent_given (BOOLEAN, NOT NULL)
communication_preferences (JSONB) -- email, sms preferences
referred_by_assessment_id (UUID, Foreign Key → assessments.id) -- for viral tracking
ip_address (INET) -- for analytics/duplicate prevention
user_agent (TEXT) -- browser info
completed_at (TIMESTAMP)
created_at (TIMESTAMP)
```

### children

```sql
id (UUID, Primary Key)
assessment_id (UUID, Foreign Key → assessments.id)
name (VARCHAR, NOT NULL)
age (INTEGER, NOT NULL)
date_of_birth (DATE)
gender (ENUM: 'male', 'female', 'other', 'prefer_not_to_say')
is_primary_child (BOOLEAN) -- if parent has multiple kids, which one triggered the assessment
created_at (TIMESTAMP)
```

### survey_responses

```sql
id (UUID, Primary Key)
child_id (UUID, Foreign Key → children.id)
lifestyle_stressors (JSONB) -- {"birth_trauma": true, "excessive_screen_time": false, ...}
symptoms (JSONB) -- {"headaches_frequency": "weekly", "focus_issues": true, ...}
additional_notes (TEXT) -- any free-form input
created_at (TIMESTAMP)
```

### reports

```sql
id (UUID, Primary Key)
child_id (UUID, Foreign Key → children.id)
brain_o_meter_score (INTEGER) -- 0-100 scale
spinal_concern_areas (JSONB) -- {"cervical": true, "thoracic": false, "lumbar": true}
organ_system_connections (JSONB) -- mappings based on assessment
personalized_recommendations (TEXT)
pdf_url (VARCHAR) -- generated PDF location
share_token (VARCHAR, UNIQUE) -- for public sharing links
times_shared (INTEGER, DEFAULT 0)
times_viewed (INTEGER, DEFAULT 0)
created_at (TIMESTAMP)
```

### report_shares

```sql
id (UUID, Primary Key)
report_id (UUID, Foreign Key → reports.id)
shared_via (ENUM: 'email', 'facebook', 'twitter', 'instagram', 'whatsapp', 'copy_link')
shared_at (TIMESTAMP)
clicked_at (TIMESTAMP) -- when someone clicked the shared link
ip_address (INET)
user_agent (TEXT)
resulted_in_assessment (BOOLEAN, DEFAULT false)
resulting_assessment_id (UUID, Foreign Key → assessments.id)
```

## Email System Tables

### email_contacts

```sql
id (UUID, Primary Key)
practice_id (UUID, Foreign Key → practices.id)
email (VARCHAR, NOT NULL)
name (VARCHAR)
source (ENUM: 'assessment', 'csv_upload', 'manual_entry')
contact_type (ENUM: 'parent', 'existing_patient')
subscribed (BOOLEAN, DEFAULT true)
unsubscribed_at (TIMESTAMP)
bounce_count (INTEGER, DEFAULT 0)
last_engagement (TIMESTAMP) -- last email open/click
upload_batch_id (UUID) -- for CSV uploads
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### email_campaigns

```sql
id (UUID, Primary Key)
practice_id (UUID, Foreign Key → practices.id)
campaign_type (ENUM: 'welcome_series', 'educational', 'custom', 'newsletter')
subject_line (VARCHAR, NOT NULL)
content (TEXT, NOT NULL) -- HTML email content
scheduled_for (TIMESTAMP)
sent_at (TIMESTAMP)
recipient_count (INTEGER)
open_count (INTEGER, DEFAULT 0)
click_count (INTEGER, DEFAULT 0)
bounce_count (INTEGER, DEFAULT 0)
created_at (TIMESTAMP)
```

### email_sends

```sql
id (UUID, Primary Key)
campaign_id (UUID, Foreign Key → email_campaigns.id)
contact_id (UUID, Foreign Key → email_contacts.id)
sent_at (TIMESTAMP)
opened_at (TIMESTAMP)
clicked_at (TIMESTAMP)
bounced_at (TIMESTAMP)
bounce_reason (TEXT)
unsubscribed_at (TIMESTAMP)
```

### email_templates

```sql
id (UUID, Primary Key)
practice_id (UUID, Foreign Key → practices.id) -- NULL for global templates
name (VARCHAR, NOT NULL)
template_type (ENUM: 'welcome', 'educational', 'custom')
subject_template (VARCHAR)
content_template (TEXT) -- with placeholder variables
is_active (BOOLEAN, DEFAULT true)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

## Analytics & Tracking Tables

### practice_analytics

```sql
id (UUID, Primary Key)
practice_id (UUID, Foreign Key → practices.id)
date (DATE, NOT NULL)
assessments_completed (INTEGER, DEFAULT 0)
reports_generated (INTEGER, DEFAULT 0)
reports_shared (INTEGER, DEFAULT 0)
viral_assessments (INTEGER, DEFAULT 0) -- assessments from shares
email_subscribers_gained (INTEGER, DEFAULT 0)
total_email_subscribers (INTEGER, DEFAULT 0)
created_at (TIMESTAMP)
```

### survey_question_definitions

```sql
id (UUID, Primary Key)
category (ENUM: 'lifestyle_stressors', 'symptoms')
question_key (VARCHAR, NOT NULL) -- e.g., 'birth_trauma', 'headaches_frequency'
question_text (TEXT, NOT NULL)
question_type (ENUM: 'boolean', 'multiple_choice', 'scale')
options (JSONB) -- for multiple choice questions
display_order (INTEGER)
is_active (BOOLEAN, DEFAULT true)
created_at (TIMESTAMP)
```

## Key Relationships & Indexes

### Important Relationships

- **One Practice** → Many Assessments
- **One Assessment** → Many Children (but typically 1)
- **One Child** → One Survey Response → One Report
- **One Assessment** can refer other Assessments (viral tracking)
- **One Practice** → Many Email Contacts → Many Email Campaigns

### Recommended Indexes

```sql
-- Performance indexes
CREATE INDEX idx_assessments_practice_id ON assessments(practice_id);
CREATE INDEX idx_assessments_parent_email ON assessments(parent_email);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);
CREATE INDEX idx_reports_share_token ON reports(share_token);
CREATE INDEX idx_email_contacts_practice_email ON email_contacts(practice_id, email);
CREATE INDEX idx_practice_analytics_date ON practice_analytics(practice_id, date);

-- Unique constraints
CREATE UNIQUE INDEX idx_unique_practice_branding ON practice_branding(practice_id);
CREATE UNIQUE INDEX idx_unique_report_share_token ON reports(share_token);
```

## Data Considerations

### JSONB Usage Rationale

- **survey_responses**: Flexible storage for predefined checkbox responses
- **spinal_concern_areas**: Boolean flags for different spinal regions
- **organ_system_connections**: Dynamic mapping based on assessment logic
- **communication_preferences**: Email/SMS preferences structure

### Security & Privacy

- No sensitive health data stored beyond survey responses
- Parent email addresses encrypted at rest
- Share tokens are cryptographically secure
- All timestamps in UTC
- IP addresses for duplicate prevention only

### Scalability Considerations

- UUIDs for distributed system readiness
- Partitioning potential on date fields for analytics tables
- JSONB for flexible query capabilities on assessment data
- Separate email tracking for performance
