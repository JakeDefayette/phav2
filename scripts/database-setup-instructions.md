# Database Setup Instructions

## Quick Setup for Testing Authentication

To test the login/logout functionality, you need to create the `user_profiles` table in your Supabase database.

### Steps:

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project dashboard

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Setup Script**
   - Copy the contents of `scripts/setup-user-profiles.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the script

4. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see a new table called `user_profiles`
   - The table should have the following columns:
     - `id` (UUID, Primary Key)
     - `email` (Text)
     - `role` (Text)
     - `firstName` (Text)
     - `lastName` (Text)
     - `practiceId` (Text, nullable)
     - `createdAt` (Timestamp)
     - `updatedAt` (Timestamp)

### What This Sets Up:

- **User Profiles Table**: Extends Supabase auth with additional user information
- **Row Level Security**: Ensures users can only access their own data
- **Automatic Timestamps**: Updates `updated_at` automatically
- **Performance Indexes**: For faster queries
- **Data Validation**: Ensures role is either 'parent' or 'chiropractor'

### After Setup:

Once you've run this script, you should be able to:
- Register new users through the application
- Login with existing users
- Access the dashboard after authentication

The authentication flow will work as follows:
1. User registers → Creates auth.users entry + user_profiles entry
2. User logs in → Validates credentials and fetches profile data
3. User accesses protected routes → Profile data is available in the app 