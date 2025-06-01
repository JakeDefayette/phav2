'use client';

import { useState } from 'react';
import { loginUser } from '@/shared/services/auth';

export default function TestLoginPage() {
  const [email, setEmail] = useState('jtdefayette@gmail.com');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const userProfile = await loginUser({ email, password });
      setResult({
        success: true,
        data: userProfile,
        message: 'Login successful!',
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Login failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-8 max-w-md mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Test Login</h1>

      <form onSubmit={testLogin} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Email:</label>
          <input
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full px-3 py-2 border rounded'
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Password:</label>
          <input
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='w-full px-3 py-2 border rounded'
            required
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50'
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </form>

      {result && (
        <div
          className={`mt-6 p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}
        >
          <h3 className='font-semibold mb-2'>{result.message}</h3>
          <pre className='text-xs overflow-auto'>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
