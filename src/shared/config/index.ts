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
    environment: z.enum(['development', 'staging', 'production']),
    base_url: z.string().url(),
  }),
  auth: z.object({
    redirect_url: z.string().url(),
  }),
});

export type Config = z.infer<typeof configSchema>;

function createConfig(): Config {
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
        (process.env.NODE_ENV as 'development' | 'staging' | 'production') ||
        'development',
      base_url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
    auth: {
      redirect_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors
        .map(err => err.path.join('.'))
        .join(', ');
      throw new Error(
        `Configuration validation failed. Missing or invalid fields: ${missingFields}`
      );
    }
    throw error;
  }
}

export const config = createConfig();
