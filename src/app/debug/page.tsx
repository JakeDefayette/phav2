'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/shared/services/supabase';

export default function DebugPage() {
  const [envCheck, setEnvCheck] = useState<Record<string, any>>({});
  const [supabaseTest, setSupabaseTest] = useState<Record<string, any>>({});

  useEffect(() => {
    // Check environment variables
    console.log('Raw process.env:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });

    const envVars = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
      // Check if variables exist at all
      hasUrl: typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined',
      hasAnonKey:
        typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined',
      // Check all process.env keys that start with NEXT_PUBLIC
      allNextPublicKeys: Object.keys(process.env).filter(key =>
        key.startsWith('NEXT_PUBLIC')
      ),
    };
    setEnvCheck(envVars);

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        // Test 1: Basic auth status
        const { data: session, error: sessionError } =
          await supabase.auth.getSession();

        // Test 2: Try a simple query (should fail gracefully if not authenticated)
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, email')
          .limit(1);

        setSupabaseTest({
          session: {
            data: session,
            error: sessionError?.message || null,
          },
          profileQuery: {
            data: profiles,
            error: profileError?.message || null,
          },
          connectionTest: 'Success',
        });
      } catch (error) {
        setSupabaseTest({
          connectionTest: 'Failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    testSupabase();
  }, []);

  const testLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jtdefayette@gmail.com',
        password: 'your-password-here',
      });

      console.log('Login test result:', { data, error });

      if (error) {
        alert(`Login error: ${error.message}`);
      } else {
        alert('Login successful!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Login test failed:', error);
      alert(`Login test failed: ${error}`);
    }
  };

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Debug Supabase Configuration</h1>

      {/* Environment Variables */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Environment Variables</h2>
        <div className='bg-gray-100 p-4 rounded'>
          <pre>{JSON.stringify(envCheck, null, 2)}</pre>
        </div>
      </div>

      {/* Supabase Connection Test */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Supabase Connection Test</h2>
        <div className='bg-gray-100 p-4 rounded'>
          <pre>{JSON.stringify(supabaseTest, null, 2)}</pre>
        </div>
      </div>

      {/* Manual Login Test */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Manual Login Test</h2>
        <button
          onClick={testLogin}
          className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
        >
          Test Login with jtdefayette@gmail.com
        </button>
        <p className='text-sm text-gray-600 mt-2'>
          Note: Replace password in code before testing
        </p>
      </div>
    </div>
  );
}
