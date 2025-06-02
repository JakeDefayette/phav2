Task Title: Implement Admin Dashboard and User Management System
Priority: High
Task Description:
Create a comprehensive admin-level system for the Chiropractic Practice Growth Platform that allows platform administrators to manage practices, users, and system-wide operations. This admin layer is critical for onboarding new chiropractic offices and managing user permissions.
Current State:

Anonymous users can complete surveys and receive reports
Parents can create accounts and log in
No way to create new chiropractic practices (missing practiceID generation)
No ability to change user permissions or roles
No centralized management interface for platform operations

Required Functionality:

Admin Authentication & Access Control

Create admin-only authentication flow
Implement role-based access control (RBAC) with admin privileges
Secure admin routes with proper middleware
Add admin user type to existing user schema


Practice Management Module

Create new chiropractic practices with auto-generated unique practiceIDs
Edit existing practice information (name, contact, branding)
Enable/disable practices
View practice-specific analytics and metrics
Manage practice subscription status


User Management Module

View all users in the system (parents, chiropractors, admins)
Change user roles/permissions (parent ↔ chiropractor ↔ admin)
Search and filter users
Reset user passwords
Suspend/reactivate user accounts
View user activity history


Platform Analytics Dashboard

Total practices, users, and assessments overview
Revenue metrics and subscription tracking
Viral coefficient and growth metrics
Assessment completion rates
Email engagement statistics


System Configuration

Manage global email templates
Configure survey questions
Set platform-wide settings
Manage educational content library



Technical Requirements:

Use existing Next.js and Supabase stack
Implement proper RLS (Row Level Security) policies for admin access
Create modular, reusable components following project's modularity standards
Ensure all admin actions are logged for audit purposes
Mobile-responsive design for admin dashboard

Database Schema Updates Needed:

Add user_roles table or enum for role management
Add admin_audit_log table for tracking admin actions
Update practices table to include practiceID generation
Add practice_status field for enable/disable functionality

UI/UX Considerations:

Clean, professional admin interface
Clear navigation between admin modules
Confirmation dialogs for destructive actions
Search and filtering capabilities
Export functionality for reports

Success Criteria:

Admin can create new practices and generate practiceIDs
Admin can change user permissions from parent to chiropractor
All admin actions are properly secured and logged
Dashboard provides clear overview of platform health
System is scalable for future admin features

Dependencies:

Current authentication system
Existing database schema
User management patterns from parent/chiropractor flows