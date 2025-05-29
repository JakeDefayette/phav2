'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleStartAssessment = () => {
    router.push('/survey');
  };

  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex'>
        <p className='fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'>
          Chiropractic Practice Growth Platform
        </p>

        {!loading && (
          <div className='fixed right-4 top-4 lg:static lg:ml-auto'>
            {user ? (
              <Link href='/dashboard'>
                <Button variant='primary' size='sm'>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className='flex gap-2'>
                <Link href='/auth/login'>
                  <Button variant='outline' size='sm'>
                    Sign In
                  </Button>
                </Link>
                <Link href='/auth/register'>
                  <Button variant='outline' size='sm'>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative flex flex-col place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <h1 className='text-5xl font-bold text-center mb-6 max-w-4xl leading-tight'>
          Get Your Child's Complete
          <span className='text-blue-600'> Health Assessment</span>
        </h1>
        <p className='text-xl text-gray-600 text-center max-w-3xl mb-4 leading-relaxed'>
          Receive a personalized health report with expert insights, growth
          tracking, and actionable recommendations for your child's development
          and wellbeing.
        </p>

        <div className='flex flex-wrap justify-center gap-4 mb-8 text-sm text-gray-500'>
          <span className='flex items-center gap-1'>
            <span className='text-green-500'>✓</span>
            5-minute assessment
          </span>
          <span className='flex items-center gap-1'>
            <span className='text-green-500'>✓</span>
            Instant PDF report
          </span>
          <span className='flex items-center gap-1'>
            <span className='text-green-500'>✓</span>
            Expert pediatric insights
          </span>
          <span className='flex items-center gap-1'>
            <span className='text-green-500'>✓</span>
            {user ? 'Saved to your account' : 'No signup required'}
          </span>
        </div>
      </div>

      <div className='mb-8 flex justify-center items-center relative z-50'>
        <Button
          variant='primary'
          size='lg'
          onClick={handleStartAssessment}
          className='shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white bg-blue-600 hover:bg-blue-700 border-0 cursor-pointer'
          style={{ position: 'relative', zIndex: 100 }}
        >
          Start Free Assessment →
        </Button>
      </div>

      {!loading && (
        <div className='flex flex-col items-center gap-4'>
          {!user ? (
            <div className='flex flex-col items-center'>
              <p className='text-sm text-gray-500 mb-3'>
                Want to save your results and track progress over time?
              </p>
              <div className='flex gap-3'>
                <Link href='/auth/register'>
                  <Button variant='outline' size='md'>
                    Create Free Account
                  </Button>
                </Link>
                <Link href='/auth/login'>
                  <Button variant='ghost' size='md'>
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center'>
              <p className='text-sm text-gray-600 mb-3'>
                Welcome back, {user.email}! Your results will be saved
                automatically.
              </p>
              <Link href='/dashboard'>
                <Button variant='outline' size='md'>
                  View Previous Assessments
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      <div className='mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left'>
        <div className='group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30'>
          <h2 className='mb-3 text-2xl font-semibold'>
            Health Tracking{' '}
            <span className='inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none'>
              →
            </span>
          </h2>
          <p className='m-0 max-w-[30ch] text-sm opacity-50'>
            Track your child's health metrics and developmental progress over
            time.
          </p>
        </div>

        <div className='group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30'>
          <h2 className='mb-3 text-2xl font-semibold'>
            Expert Analysis{' '}
            <span className='inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none'>
              →
            </span>
          </h2>
          <p className='m-0 max-w-[30ch] text-sm opacity-50'>
            Get professional insights from pediatric health experts and
            chiropractors.
          </p>
        </div>

        <div className='group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30'>
          <h2 className='mb-3 text-2xl font-semibold'>
            Personalized Reports{' '}
            <span className='inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none'>
              →
            </span>
          </h2>
          <p className='m-0 max-w-[30ch] text-sm opacity-50'>
            Receive detailed, personalized health recommendations for your
            child.
          </p>
        </div>

        <div className='group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30'>
          <h2 className='mb-3 text-2xl font-semibold'>
            Family Care{' '}
            <span className='inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none'>
              →
            </span>
          </h2>
          <p className='m-0 max-w-[30ch] text-sm opacity-50'>
            Connect with other families and healthcare providers in your
            community.
          </p>
        </div>
      </div>
    </main>
  );
}
