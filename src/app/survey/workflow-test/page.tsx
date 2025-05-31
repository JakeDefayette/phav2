'use client';

import React, { useState } from 'react';
import {
  MultiStepSurveyFormWithWorkflow,
  SurveyFormData,
} from '@/shared/components/organisms';
import { Button } from '@/shared/components/atoms/Button';

export default function WorkflowTestPage() {
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<'normal' | 'error' | 'slow'>(
    'normal'
  );

  const handleSubmit = async (values: SurveyFormData) => {
    console.log('🚀 Form submitted with values:', values);

    try {
      // Simulate different test scenarios
      switch (testMode) {
        case 'error':
          // Simulate submission error
          await new Promise(resolve => setTimeout(resolve, 1000));
          throw new Error('Simulated submission error for testing');

        case 'slow':
          // Simulate slow submission
          await new Promise(resolve => setTimeout(resolve, 5000));
          break;

        default:
          // Normal submission
          await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setSubmissionResult(
        '✅ Survey submitted successfully! Workflow completed.'
      );

      // In a real app, this would navigate to the results page
      console.log('📊 Would redirect to results page with assessment data');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setSubmissionResult(`❌ Submission failed: ${errorMessage}`);
      throw error; // Re-throw so workflow can handle it
    }
  };

  const clearResult = () => {
    setSubmissionResult(null);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Test Controls */}
      <div className='bg-blue-50 border-b border-blue-200 p-4'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-xl font-bold text-blue-900 mb-4'>
            🧪 Workflow State Management Test Page
          </h1>

          <div className='flex flex-wrap gap-4 items-center'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium text-blue-800'>
                Test Mode:
              </label>
              <select
                value={testMode}
                onChange={e => setTestMode(e.target.value as typeof testMode)}
                className='border border-blue-300 rounded px-3 py-1 text-sm'
              >
                <option value='normal'>Normal (2s delay)</option>
                <option value='slow'>Slow (5s delay)</option>
                <option value='error'>Error (simulated failure)</option>
              </select>
            </div>

            {submissionResult && (
              <div className='flex items-center gap-2'>
                <span className='text-sm text-blue-800'>
                  {submissionResult}
                </span>
                <Button size='sm' variant='outline' onClick={clearResult}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          <div className='mt-3 text-sm text-blue-700'>
            <p>
              <strong>Test Features:</strong>
            </p>
            <ul className='list-disc list-inside space-y-1 ml-4'>
              <li>
                Fill out some fields and refresh the page to test persistence
              </li>
              <li>Try switching test modes to simulate errors and recovery</li>
              <li>Check browser localStorage for workflow state data</li>
              <li>Open browser console to see workflow state logs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Survey Form */}
      <div className='py-8'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-gray-900 mb-2'>
              Pediatric Health Assessment
            </h2>
            <p className='text-lg text-gray-600'>
              Complete this assessment to receive personalized health insights
              for your child
            </p>
            <p className='text-sm text-blue-600 mt-2'>
              ⚡ Enhanced with workflow state management and error recovery
            </p>
          </div>

          <MultiStepSurveyFormWithWorkflow
            onSubmit={handleSubmit}
            enableWorkflowPersistence={true}
            showRecoveryOnStart={true}
          />
        </div>
      </div>
    </div>
  );
}
