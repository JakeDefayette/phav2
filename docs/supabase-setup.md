# Supabase Auth Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `pha-v2-auth`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## 2. Configure Authentication Settings

### Enable Email/Password Authentication

1. Go to Authentication > Settings
2. Ensure "Enable email confirmations" is enabled
3. Set "Site URL" to your application URL:
   - Development: `http://localhost:3000`
   - Production: Your Vercel domain
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.vercel.app/auth/callback`

### Configure Email Templates (Optional)

1. Go to Authentication > Email Templates
2. Customize confirmation and recovery email templates
3. Update sender name and email if needed

### Enable OAuth Providers (Optional)

1. Go to Authentication > Providers
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth credentials for each provider

## 3. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Finding Your Keys

1. Go to Settings > API
2. Copy the following:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

## 4. Database Schema

The following tables will be created automatically by Supabase Auth:

- `auth.users` - Core user authentication data
- `auth.sessions` - User sessions

We'll create additional tables for user profiles:

- `public.user_profiles` - Extended user information and roles

## 5. Security Considerations

- Never expose the `service_role` key in client-side code
- Use Row Level Security (RLS) policies for data protection
- Implement proper session management
- Validate user input on both client and server sides

## 6. Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to your auth pages
3. Test registration and login flows
4. Verify session persistence across page reloads
5. Check Supabase dashboard for user creation
