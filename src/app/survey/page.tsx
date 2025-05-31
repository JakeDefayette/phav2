'use client';

import React from 'react';
import {
  MultiStepSurveyForm,
  SurveyFormData,
} from '@/shared/components/organisms';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import Link from 'next/link';

// Temporary disable RealtimeScheduler to isolate the issue
// const getRealtimeScheduler = () => {
//   if (typeof window !== 'undefined') {
//     // Only import scheduler on client side to prevent server-side issues
//     import('@/shared/services/realtime-scheduler').then(
//       ({ RealtimeScheduler }) => {
//         return RealtimeScheduler.getInstance({
//           debugMode: false, // Disable debug logging
//           adaptiveInterval: 5000, // Reduce frequency to every 5 seconds
//           adaptiveThrottling: false, // Disable adaptive throttling for survey forms
//         });
//       }
//     );
//   }
// };

export default function SurveyPage() {
  // Temporarily disable scheduler initialization
  // React.useEffect(() => {
  //   getRealtimeScheduler();
  // }, []);

  const handleSubmit = async (values: SurveyFormData) => {
    console.log('🟡 === FORM SUBMISSION STARTED ===');
    console.log('🚀 Survey submitted with values:', values);
    console.log('📝 Form data keys:', Object.keys(values));
    console.log('✅ Required fields check:', {
      parentFirstName: !!values.parentFirstName,
      parentLastName: !!values.parentLastName,
      childFirstName: !!values.childFirstName,
      childLastName: !!values.childLastName,
      childAge: !!values.childAge,
      childGender: !!values.childGender,
      email: !!values.email,
      privacyPolicy: values.privacyPolicyAcknowledged,
      medicalDisclaimer: values.medicalDisclaimerAcknowledged,
      lifestyleStressors: values.lifestyleStressors?.length > 0,
      symptoms: values.symptoms?.length > 0,
    });

    try {
      console.log('📡 === STEP 1: STARTING ASSESSMENT ===');
      // Step 1: Create an assessment to get an ID
      const startResponse = await fetch('/api/assessment/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // For now, we'll create the assessment without a child ID
          // The API will need to be updated to handle anonymous assessments
          childData: {
            firstName: values.childFirstName,
            lastName: values.childLastName,
            dateOfBirth: calculateDateOfBirth(values.childAge),
            gender: values.childGender,
          },
          parentData: {
            firstName: values.parentFirstName,
            lastName: values.parentLastName,
            email: values.email,
            phone: values.phone || undefined,
          },
        }),
      });

      console.log(
        '📥 Start response status:',
        startResponse.status,
        startResponse.statusText
      );

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('❌ Start response failed:', errorText);
        throw new Error(
          `Failed to start assessment: ${startResponse.statusText} - ${errorText}`
        );
      }

      const startResult = await startResponse.json();
      console.log('✅ Assessment started successfully:', startResult);

      const assessmentId = startResult.data.assessmentId;
      console.log('🆔 Assessment ID:', assessmentId);

      if (!assessmentId) {
        throw new Error('No assessment ID returned from start endpoint');
      }

      console.log('🗂️ === STEP 2: MAPPING SURVEY DATA ===');
      // Step 2: Map survey data to API responses format
      const responses = mapSurveyDataToResponses(values);
      console.log('📊 Mapped responses:', responses);

      console.log('🧠 === STEP 3: CALCULATING BRAIN-O-METER SCORE ===');
      // Step 3: Calculate Brain-O-Meter score (simplified for now)
      const brainOMeterScore = calculateBrainOMeterScore(values);
      console.log('🎯 Brain-O-Meter score:', brainOMeterScore);

      console.log('📡 === STEP 4: SUBMITTING ASSESSMENT ===');
      const submitPayload = {
        responses,
        brainOMeterScore,
        practiceId: null, // For anonymous assessments
      };
      console.log('📤 Submit payload:', submitPayload);

      // Step 4: Submit the assessment
      const submitResponse = await fetch(
        `/api/assessment/${assessmentId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitPayload),
        }
      );

      console.log(
        '📥 Submit response status:',
        submitResponse.status,
        submitResponse.statusText
      );

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('❌ Submit response failed:', errorText);
        throw new Error(
          `Failed to submit assessment: ${submitResponse.statusText} - ${errorText}`
        );
      }

      const submitResult = await submitResponse.json();
      console.log('✅ Assessment completed successfully:', submitResult);

      console.log('🔄 === STEP 5: REDIRECTING TO REPORT ===');
      // Step 5: Redirect to the report page
      if (submitResult.data?.shareToken) {
        // Use token-based web view for anonymous users (NEW!)
        const reportUrl = `/reports/view/${submitResult.data.shareToken}`;
        console.log('🌐 Redirecting to web report view:', reportUrl);
        console.log('🔗 Full URL will be:', window.location.origin + reportUrl);

        // Add a small delay to ensure logging is visible
        setTimeout(() => {
          console.log('🚀 Executing redirect to web view now...');
          window.location.href = reportUrl;
        }, 100);
      } else if (submitResult.data?.reportId) {
        // Fallback to report ID access (for authenticated users)
        const reportUrl = `/reports/${submitResult.data.reportId}`;
        console.log('🌐 Redirecting to authenticated report page:', reportUrl);
        console.log('🔗 Full URL will be:', window.location.origin + reportUrl);

        // Add a small delay to ensure logging is visible
        setTimeout(() => {
          console.log('🚀 Executing redirect now...');
          window.location.href = reportUrl;
        }, 100);
      } else {
        console.error(
          '❌ No report ID or share token in response:',
          submitResult
        );
        throw new Error(
          'No report generated - missing reportId and shareToken in response'
        );
      }
    } catch (error) {
      console.error('💥 === FORM SUBMISSION FAILED ===');
      console.error('❌ Assessment submission error:', error);
      console.error(
        '📍 Error stack:',
        error instanceof Error ? error.stack : 'No stack trace'
      );

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Assessment submission failed: ${errorMessage}`);
      throw error; // Re-throw so workflow can handle it
    }
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        // Report survey-specific errors
        console.error('Survey form error:', { error, errorInfo, errorId });

        // You could send this to your monitoring service
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'exception', {
            description: `Survey error: ${error.message}`,
            fatal: false,
            error_id: errorId,
            page: '/survey',
          });
        }
      }}
      fallback={({ resetError, errorId }) => (
        <div className='min-h-screen bg-gray-50 py-8'>
          <div className='container mx-auto px-4'>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Pediatric Health Assessment
              </h1>
              <p className='text-lg text-gray-600'>
                We're experiencing technical difficulties
              </p>
            </div>

            <div className='max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6'>
              <div className='text-center'>
                <div className='text-red-500 text-6xl mb-4'>⚠️</div>
                <h2 className='text-xl font-semibold mb-4'>
                  Assessment Temporarily Unavailable
                </h2>
                <p className='text-gray-600 mb-6'>
                  We're sorry, but the assessment form is currently experiencing
                  technical issues. Our team has been automatically notified.
                </p>

                <div className='space-y-3'>
                  <button
                    onClick={resetError}
                    className='w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors'
                  >
                    Try Again
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className='w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors'
                  >
                    Reload Page
                  </button>

                  <Link
                    href='/'
                    className='block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors'
                  >
                    Return Home
                  </Link>
                </div>

                {errorId && (
                  <p className='text-xs text-gray-500 mt-4'>
                    Error Reference: {errorId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Pediatric Health Assessment
            </h1>
            <p className='text-lg text-gray-600'>
              Complete this assessment to receive personalized health insights
              for your child
            </p>
          </div>

          <MultiStepSurveyForm
            onSubmit={handleSubmit}
            className='max-w-4xl mx-auto'
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Calculate date of birth from age string
 */
function calculateDateOfBirth(ageString: string): string {
  const age = parseInt(ageString, 10);
  if (isNaN(age)) {
    // Default to 5 years old if age is invalid
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 5);
    return defaultDate.toISOString().split('T')[0];
  }

  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - age);
  return currentDate.toISOString().split('T')[0];
}

/**
 * Map survey form data to API responses format
 * Uses actual question IDs from survey_question_definitions table
 */
function mapSurveyDataToResponses(values: SurveyFormData) {
  const responses = [];

  // Map lifestyle stressors using real question ID
  if (values.lifestyleStressors && values.lifestyleStressors.length > 0) {
    responses.push({
      question_id: '550e8400-e29b-41d4-a716-446655440011', // Lifestyle Stressors
      response_value: values.lifestyleStressors,
      response_text: values.lifestyleStressors.join(', '),
    });
  }

  // Map symptoms using real question ID
  if (values.symptoms && values.symptoms.length > 0) {
    responses.push({
      question_id: '550e8400-e29b-41d4-a716-446655440021', // Current Symptoms
      response_value: values.symptoms,
      response_text: values.symptoms.join(', '),
    });
  }

  // Map contact information using real question IDs
  responses.push({
    question_id: '550e8400-e29b-41d4-a716-446655440031', // Parent First Name
    response_value: values.parentFirstName,
    response_text: values.parentFirstName,
  });

  responses.push({
    question_id: '550e8400-e29b-41d4-a716-446655440032', // Parent Last Name
    response_value: values.parentLastName,
    response_text: values.parentLastName,
  });

  responses.push({
    question_id: '550e8400-e29b-41d4-a716-446655440001', // Child First Name
    response_value: values.childFirstName,
    response_text: values.childFirstName,
  });

  responses.push({
    question_id: '550e8400-e29b-41d4-a716-446655440002', // Child Last Name
    response_value: values.childLastName,
    response_text: values.childLastName,
  });

  responses.push({
    question_id: '550e8400-e29b-41d4-a716-446655440003', // Child Age
    response_value: parseInt(values.childAge, 10),
    response_text: values.childAge,
  });

  responses.push({
    question_id: '550e8400-e29b-41d4-a716-446655440004', // Child Gender
    response_value: values.childGender,
    response_text: values.childGender,
  });

  responses.push({
    question_id: '550e8400-e29b-41d4-a716-446655440033', // Email Address
    response_value: values.email,
    response_text: values.email,
  });

  if (values.phone) {
    responses.push({
      question_id: '550e8400-e29b-41d4-a716-446655440034', // Phone Number
      response_value: values.phone,
      response_text: values.phone,
    });
  }

  return responses;
}

/**
 * Calculate Brain-O-Meter score based on survey responses
 * This is a simplified calculation - in practice this would be more sophisticated
 */
function calculateBrainOMeterScore(values: SurveyFormData): number {
  let score = 85; // Start with a good baseline

  // Reduce score based on lifestyle stressors
  const stressorPenalty = (values.lifestyleStressors?.length || 0) * 2;
  score -= stressorPenalty;

  // Reduce score based on symptoms
  const symptomPenalty = (values.symptoms?.length || 0) * 3;
  score -= symptomPenalty;

  // Ensure score stays within bounds
  return Math.max(40, Math.min(100, score));
}
