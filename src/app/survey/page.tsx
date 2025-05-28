'use client';

import { MultiStepSurveyForm, SurveyFormData } from '@/components/organisms';

export default function SurveyPage() {
  const handleSubmit = async (values: SurveyFormData) => {
    // TODO: Implement actual submission logic
    alert('Survey submitted successfully!');
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Pediatric Health Assessment
          </h1>
          <p className='text-lg text-gray-600'>
            Complete this assessment to receive personalized health insights for
            your child
          </p>
        </div>

        <MultiStepSurveyForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
