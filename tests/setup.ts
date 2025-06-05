import { config } from 'dotenv';
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Global polyfills for React Email
global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder as any;

// Load environment variables from .env.local, .env.test, or .env
config({ path: '.env.local' });
config({ path: '.env.test' });
config({ path: '.env' });

// Mock environment variables for testing if not present
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test';
}
if (!process.env.ENVIRONMENT) {
  process.env.ENVIRONMENT = 'test';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
}
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = 'test-resend-api-key';
}

// Set test timeout globally
jest.setTimeout(30000);

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock crypto for testing
Object.defineProperty(global, 'crypto', {
  value: {
    timingSafeEqual: jest.fn().mockImplementation((a, b) => {
      if (a.length !== b.length) {
        throw new Error('Input buffers must have the same byte length');
      }
      return true;
    }),
    createHmac: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock-signature'),
    }),
  },
});

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
  console.log('🧪 Running tests...');
});

afterAll(async () => {
  // Any global cleanup can go here
  console.log('✅ Tests completed');
});
