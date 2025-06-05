'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PageLayout } from '@/shared/components/templates/PageLayout';

// Dynamically import the component that uses useSearchParams
const TrackingErrorContent = dynamic(() => import('./TrackingErrorContent'), {
  ssr: false,
  loading: () => (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-gray-600'>Loading...</p>
      </div>
    </div>
  ),
});

export default function TrackingErrorPage() {
  return (
    <PageLayout>
      <Suspense
        fallback={
          <div className='min-h-screen flex items-center justify-center bg-gray-50'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600'>Loading...</p>
            </div>
          </div>
        }
      >
        <TrackingErrorContent />
      </Suspense>
    </PageLayout>
  );
}
