import { Suspense } from 'react';
import { UnsubscribeForm } from '@/features/email/components/UnsubscribeForm';
import { Loading } from '@/shared/components/atoms/Loading';

interface UnsubscribePageProps {
  params: {
    token: string;
  };
  searchParams: {
    reason?: string;
  };
}

export default function UnsubscribePage({
  params,
  searchParams,
}: UnsubscribePageProps) {
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Unsubscribe from Email Lists
        </h2>
        <p className='mt-2 text-center text-sm text-gray-600'>
          We're sorry to see you go. You can unsubscribe from our emails below.
        </p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <Suspense fallback={<Loading />}>
            <UnsubscribeForm
              token={params.token}
              defaultReason={searchParams.reason}
            />
          </Suspense>
        </div>
      </div>

      <div className='mt-8 text-center'>
        <p className='text-xs text-gray-500'>
          If you believe you received this email in error, please contact
          support.
        </p>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}) {
  return {
    title: 'Unsubscribe from Email Lists',
    description: 'Unsubscribe from email communications',
    robots: 'noindex, nofollow',
  };
}
