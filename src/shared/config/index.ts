import { z } from 'zod';

const configSchema = z.object({
  database: z.object({
    url: z.string().url(),
    anon_key: z.string(),
    service_role_key: z.string().optional(),
  }),
  email: z.object({
    from: z.string().email(),
    resend_api_key: z.string().optional(),
  }),
  app: z.object({
    environment: z.enum(['development', 'staging', 'production', 'test']),
    base_url: z.string().url(),
  }),
  auth: z.object({
    redirect_url: z.string().url(),
  }),
  practice: z.object({
    name: z.string().optional(),
    logo: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
});

export type Config = z.infer<typeof configSchema>;

function createConfig(): Config {
  // Debug: Log environment variables before creating config (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Config creation - Environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
        : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`
        : 'MISSING',
      FROM_EMAIL: process.env.FROM_EMAIL,
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      anon_key_length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      service_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    });
  }

  const rawConfig = {
    database: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    email: {
      from: process.env.FROM_EMAIL || 'reports@pediatrichealth.app',
      resend_api_key: process.env.RESEND_API_KEY,
    },
    app: {
      environment:
        (process.env.NODE_ENV as 'development' | 'staging' | 'production' | 'test') ||
        'development',
      base_url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
    auth: {
      redirect_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    practice: {
      name: process.env.PRACTICE_NAME || 'Pediatric Health Assessment',
      logo: process.env.PRACTICE_LOGO,
      address: process.env.PRACTICE_ADDRESS,
      phone: process.env.PRACTICE_PHONE,
      website: process.env.PRACTICE_WEBSITE,
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors
        .map(err => err.path.join('.'))
        .join(', ');

      // Enhanced error message with actual values
      console.error('Configuration validation failed!', {
        missingFields,
        rawConfig,
        envVars: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      });

      throw new Error(
        `Configuration validation failed. Missing or invalid fields: ${missingFields}. Check that environment variables are properly set.`
      );
    }
    throw error;
  }
}

export const config = createConfig();
