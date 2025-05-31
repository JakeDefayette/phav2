'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, FormikHelpers, Field } from 'formik';
import { Button, Checkbox } from '@/shared/components/atoms';
import {
  StepIndicator,
  CheckboxGroup,
  RadioGroup,
  FormField,
  StepTransition,
  Alert,
} from '@/shared/components/molecules';
import { Skeleton } from '@/shared/components/atoms/Skeleton';
import { cn } from '@/shared/utils/cn';
import { useRouter } from 'next/navigation';
import { useUIFeedback } from '@/shared/hooks/useUIFeedback';

// Import types and data
import { SurveyFormData, INITIAL_VALUES, FORM_STEPS } from './types';
import { getValidationSchemaForStep } from './validation';
import {
  LIFESTYLE_STRESSOR_OPTIONS,
  SYMPTOM_OPTIONS,
  GENDER_OPTIONS,
} from './formData';

// Import workflow state management
import { useWorkflowState } from '../../hooks/useWorkflowState';
import { WorkflowRecovery } from '../WorkflowRecovery/WorkflowRecovery';

export interface MultiStepSurveyFormWithWorkflowProps {
  onSubmit: (values: SurveyFormData) => void | Promise<void>;
  className?: string;
  enableWorkflowPersistence?: boolean;
  showRecoveryOnStart?: boolean;
}

const FormikValuesChangeObserver: React.FC<{
  values: SurveyFormData;
  formValues: SurveyFormData;
  currentStep: number;
  enableWorkflowPersistence: boolean;
  setFormValues: (values: SurveyFormData) => void;
  saveFormData: (step: number, values: SurveyFormData) => void;
}> = ({
  values,
  formValues,
  currentStep,
  enableWorkflowPersistence,
  setFormValues,
  saveFormData,
}) => {
  React.useEffect(() => {
    if (
      enableWorkflowPersistence &&
      JSON.stringify(values) !== JSON.stringify(formValues)
    ) {
      setFormValues(values);
      saveFormData(currentStep, values);
    }
  }, [
    values,
    currentStep,
    formValues,
    saveFormData,
    enableWorkflowPersistence,
    setFormValues,
  ]);

  return null; // This component doesn't render anything itself
};

export const MultiStepSurveyFormWithWorkflow: React.FC<
  MultiStepSurveyFormWithWorkflowProps
> = ({
  onSubmit,
  className,
  enableWorkflowPersistence = true,
  showRecoveryOnStart = true,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [previousStep, setPreviousStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [formValues, setFormValues] = useState<SurveyFormData>(INITIAL_VALUES);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>(
    'forward'
  );
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);

  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    withFeedback,
    showValidationError,
    showNetworkError,
  } = useUIFeedback();

  // Workflow state management
  const {
    state: workflowState,
    isLoading: workflowLoading,
    error: workflowError,
    canResume,
    startSession,
    resumeSession,
    updateFormData,
    updateProgress,
    reportError,
    recoverFromErrors,
    completeWorkflow,
    clearState,
    getFormDataForStep,
    hasUnsavedChanges,
  } = useWorkflowState({
    autoStart: enableWorkflowPersistence,
    anonymous: true,
    onStateChange: state => {
      // eslint-disable-next-line no-console
      console.log('📊 Workflow state changed:', state);

      // Update form step based on workflow state
      if (state.currentStep !== currentStep) {
        setCurrentStep(state.currentStep);
      }

      // Update form values if we have workflow data
      if (Object.keys(state.formData).length > 0) {
        setFormValues(prev => ({ ...prev, ...state.formData }));
      }
    },
    onError: error => {
      // eslint-disable-next-line no-console
      console.error('🚨 Workflow error:', error);
      showNetworkError('Failed to save progress');
    },
  });

  // Check for resumable session on mount
  useEffect(() => {
    if (enableWorkflowPersistence && canResume && showRecoveryOnStart) {
      setShowRecovery(true);
      showInfo(
        'Previous session found',
        'You can resume where you left off or start fresh.'
      );
    }
  }, [canResume, enableWorkflowPersistence, showRecoveryOnStart, showInfo]);

  // Auto-save form data when values change
  const saveFormData = useCallback(
    async (step: number, values: SurveyFormData) => {
      if (enableWorkflowPersistence && workflowState) {
        try {
          await updateFormData(step, values, false); // Use debounced save
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to save form data:', error);
          showWarning(
            'Auto-save failed',
            'Your progress might not be saved automatically.'
          );
        }
      }
    },
    [enableWorkflowPersistence, workflowState, updateFormData, showWarning]
  );

  const handleStepTransition = useCallback(
    async (newStep: number, direction: 'forward' | 'backward') => {
      setIsStepTransitioning(true);
      setStepDirection(direction);

      // Wait for transition to start
      await new Promise(resolve => setTimeout(resolve, 50));

      setPreviousStep(currentStep);
      setCurrentStep(newStep);

      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsStepTransitioning(false);
    },
    [currentStep]
  );

  const handleNext = async (
    values: SurveyFormData,
    { setFieldTouched, validateForm }: FormikHelpers<SurveyFormData>
  ) => {
    return withFeedback(
      async () => {
        // Validate current step
        const currentStepSchema = getValidationSchemaForStep(currentStep);
        await currentStepSchema.validate(values, { abortEarly: false });

        // Save current step data
        await saveFormData(currentStep, values);

        // Move to next step with transition
        const nextStep = currentStep + 1;
        await handleStepTransition(nextStep, 'forward');

        // Update workflow state with immediate save
        if (enableWorkflowPersistence) {
          await updateFormData(nextStep, values, true);
        }

        // Show progress feedback
        const stepName =
          FORM_STEPS[currentStep - 1]?.title || `Step ${currentStep}`;
        showSuccess('Progress saved', `${stepName} completed successfully!`);
      },
      {
        loadingMessage: 'Saving progress...',
        successMessage: undefined, // We handle this manually above
      }
    );
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      await handleStepTransition(prevStep, 'backward');

      // Update workflow state
      if (enableWorkflowPersistence) {
        await updateFormData(prevStep, formValues, true);
      }
    }
  };

  const handleSubmit = async (
    values: SurveyFormData,
    helpers: FormikHelpers<SurveyFormData>
  ) => {
    if (currentStep < FORM_STEPS.length) {
      await handleNext(values, helpers);
    } else {
      setIsSubmitting(true);

      return withFeedback(
        async () => {
          // Final save before submission
          if (enableWorkflowPersistence) {
            await updateFormData(currentStep, values, true);
          }

          await onSubmit(values);

          // Complete workflow
          if (enableWorkflowPersistence) {
            await completeWorkflow();
          }

          showSuccess(
            'Assessment completed!',
            'Your personalized report is being generated.'
          );
        },
        {
          loadingMessage: 'Generating your personalized report...',
          successMessage: undefined, // We handle this manually above
        }
      ).finally(() => {
        setIsSubmitting(false);
      });
    }
  };

  // Recovery handlers with feedback
  const handleResume = async () => {
    return withFeedback(
      async () => {
        // eslint-disable-next-line no-console
        console.log('Attempting to resume session...');
        await resumeSession();
        const resumedStep = workflowState?.currentStep || 1;
        setShowRecovery(false);
        showSuccess(
          'Session resumed',
          'Welcome back! Continuing from where you left off.'
        );
      },
      {
        loadingMessage: 'Resuming session...',
        successMessage: 'Session resumed successfully!',
      }
    );
  };

  const handleRecovery = async (options: any): Promise<boolean> => {
    try {
      await withFeedback(
        async () => {
          // eslint-disable-next-line no-console
          console.log('Attempting data recovery with options:', options);
          await recoverFromErrors(options);
          setShowRecovery(false);
          showSuccess('Recovery successful', 'Your session has been restored.');
        },
        {
          loadingMessage: 'Recovering data...',
          successMessage: 'Data recovery successful!',
        }
      );
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Data recovery failed:', error);
      showError('Data recovery failed', 'Please try starting fresh.');
      return false;
    }
  };

  const handleStartFresh = async () => {
    return withFeedback(
      async () => {
        // eslint-disable-next-line no-console
        console.log('Starting a fresh session...');
        await startSession();
        setFormValues(INITIAL_VALUES);
        setShowRecovery(false);
        showInfo('Starting fresh', 'New assessment session started.');
      },
      {
        loadingMessage: 'Starting fresh session...',
        successMessage: 'New session started!',
      }
    );
  };

  const handleClearAll = async () => {
    return withFeedback(
      async () => {
        // eslint-disable-next-line no-console
        console.log('Clearing all workflow state...');
        await clearState();
        setFormValues(INITIAL_VALUES);
        setCurrentStep(1);
        setShowRecovery(false);
        showInfo('Session cleared', 'All data has been removed.');
      },
      {
        loadingMessage: 'Clearing state...',
        successMessage: 'All workflow data cleared!',
      }
    );
  };

  const renderStepContent = (values: SurveyFormData) => {
    switch (currentStep) {
      case 1:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Lifestyle Stressors
              </h2>
              <p className='text-gray-600'>
                Select all lifestyle factors that apply to your child
              </p>
            </div>
            <CheckboxGroup
              name='lifestyleStressors'
              options={LIFESTYLE_STRESSOR_OPTIONS}
              columns={2}
              required
            />
          </div>
        );

      case 2:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Symptoms
              </h2>
              <p className='text-gray-600'>
                Select all symptoms your child is experiencing
              </p>
            </div>
            <CheckboxGroup
              name='symptoms'
              options={SYMPTOM_OPTIONS}
              columns={2}
              required
            />
          </div>
        );

      case 3:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Contact Information & Consent
              </h2>
              <p className='text-gray-600'>
                Complete your information to receive your personalized report
              </p>
            </div>

            {/* Parent/Guardian Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Parent/Guardian Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  name='parentFirstName'
                  label='Parent/Guardian First Name'
                  required
                />
                <FormField
                  name='parentLastName'
                  label='Parent/Guardian Last Name'
                  required
                />
              </div>
            </div>

            {/* Child Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Child Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  name='childFirstName'
                  label="Child's First Name"
                  required
                />
                <FormField
                  name='childLastName'
                  label="Child's Last Name"
                  required
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  name='childAge'
                  label="Child's Age"
                  type='number'
                  min='0'
                  max='18'
                  required
                />
                <RadioGroup
                  name='childGender'
                  label="Child's Gender"
                  options={GENDER_OPTIONS}
                  direction='horizontal'
                  required
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Contact Details
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  name='email'
                  label='Email Address'
                  type='email'
                  placeholder='your@email.com'
                  required
                />
                <FormField
                  name='phone'
                  label='Mobile Phone Number (Optional)'
                  type='tel'
                  placeholder='(123) 456-7890'
                />
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Required Consent
              </h3>
              <div className='space-y-4'>
                <div>
                  <Field name='privacyPolicyAcknowledged'>
                    {({ field, meta }: any) => (
                      <div>
                        <Checkbox
                          id='privacyPolicyAcknowledged'
                          label='I acknowledge the privacy policy'
                          checked={field.value}
                          onChange={field.onChange}
                          variant={
                            meta.touched && meta.error ? 'error' : 'default'
                          }
                        />
                        <p className='ml-7 text-xs text-gray-500 mt-1'>
                          Your information is protected and will only be used
                          for health assessment purposes.
                        </p>
                        {meta.touched && meta.error && (
                          <p className='ml-7 text-sm text-red-600 mt-1'>
                            {meta.error}
                          </p>
                        )}
                      </div>
                    )}
                  </Field>
                </div>
                <div>
                  <Field name='medicalDisclaimerAcknowledged'>
                    {({ field, meta }: any) => (
                      <div>
                        <Checkbox
                          id='medicalDisclaimerAcknowledged'
                          label='I understand this is not a medical diagnosis'
                          checked={field.value}
                          onChange={field.onChange}
                          variant={
                            meta.touched && meta.error ? 'error' : 'default'
                          }
                        />
                        <p className='ml-7 text-xs text-gray-500 mt-1'>
                          This assessment is for educational purposes only and
                          does not replace professional medical advice.
                        </p>
                        {meta.touched && meta.error && (
                          <p className='ml-7 text-sm text-red-600 mt-1'>
                            {meta.error}
                          </p>
                        )}
                      </div>
                    )}
                  </Field>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show recovery interface if needed
  if (showRecovery && workflowState) {
    return (
      <div className={cn('max-w-4xl mx-auto p-6', className)}>
        <WorkflowRecovery
          state={workflowState}
          isLoading={workflowLoading}
          onResume={handleResume}
          onRecover={handleRecovery}
          onStartFresh={handleStartFresh}
          onClearAll={handleClearAll}
        />
      </div>
    );
  }

  // Show enhanced loading state with skeleton
  if (workflowLoading) {
    return (
      <div className={cn('max-w-4xl mx-auto p-6', className)}>
        <div className='space-y-8'>
          {/* Step Indicator Skeleton */}
          <div className='flex justify-center'>
            <div className='flex space-x-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant='circular' className='w-8 h-8' />
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className='space-y-6'>
            <div className='text-center space-y-2'>
              <Skeleton variant='text' className='w-64 h-8 mx-auto' />
              <Skeleton variant='text' className='w-96 h-5 mx-auto' />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton variant='text' className='w-full h-4' />
                  <Skeleton variant='rectangular' className='w-full h-10' />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Skeleton */}
          <div className='flex justify-between pt-6 border-t border-gray-200'>
            <Skeleton variant='rectangular' className='w-20 h-10' />
            <Skeleton variant='rectangular' className='w-24 h-10' />
          </div>
        </div>

        <div className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show workflow error with alert
  if (workflowError) {
    return (
      <div className={cn('max-w-4xl mx-auto p-6', className)}>
        <Alert
          variant='error'
          title='Assessment Error'
          description='There was a problem loading your assessment. Please try refreshing the page.'
          action={{
            label: 'Retry',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  // Get initial values (merge workflow data with defaults)
  const initialValues: SurveyFormData = {
    ...INITIAL_VALUES,
    ...formValues,
  };

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      <Formik
        initialValues={initialValues}
        validationSchema={getValidationSchemaForStep(currentStep)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isValid, setValues, errors, touched }) => {
          return (
            <Form className='space-y-8'>
              <FormikValuesChangeObserver
                values={values}
                formValues={formValues}
                currentStep={currentStep}
                enableWorkflowPersistence={enableWorkflowPersistence}
                setFormValues={setFormValues}
                saveFormData={saveFormData}
              />

              {/* Workflow State Indicator */}
              {enableWorkflowPersistence && workflowState && (
                <Alert
                  variant='info'
                  className='mb-4'
                  description={
                    <div className='flex items-center justify-between text-sm'>
                      <span>
                        Session: {workflowState.sessionId.split('_')[1]} •
                        {workflowState.isAnonymous
                          ? ' Anonymous'
                          : ' Authenticated'}{' '}
                        • Saved {workflowState.savedCount} times
                      </span>
                      {hasUnsavedChanges() && (
                        <span className='text-amber-600 text-xs'>
                          Unsaved changes will be auto-saved
                        </span>
                      )}
                    </div>
                  }
                />
              )}

              {/* Step Indicator */}
              <StepIndicator
                steps={FORM_STEPS}
                currentStep={currentStep}
                className='mb-8'
              />

              {/* Step Content with Transition */}
              <StepTransition
                currentStep={currentStep}
                direction={stepDirection}
                isTransitioning={isStepTransitioning}
                className='min-h-[400px]'
              >
                {renderStepContent(values)}
              </StepTransition>

              {/* Form Validation Errors Summary */}
              {Object.keys(errors).length > 0 &&
                Object.keys(touched).length > 0 && (
                  <Alert
                    variant='warning'
                    title='Form Incomplete'
                    description='Please review and complete all required fields before continuing.'
                    className='mt-4'
                  />
                )}

              {/* Navigation Buttons */}
              <div className='flex justify-between pt-6 border-t border-gray-200'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleBack}
                  disabled={currentStep === 1 || isStepTransitioning}
                  className='transition-opacity duration-200'
                >
                  Back
                </Button>

                <div className='flex items-center space-x-4'>
                  {/* Clear State Button (Development) */}
                  {process.env.NODE_ENV === 'development' &&
                    enableWorkflowPersistence && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={handleClearAll}
                        className='text-gray-500 hover:text-gray-700 transition-colors duration-200'
                      >
                        Clear State
                      </Button>
                    )}

                  <Button
                    type='submit'
                    disabled={isSubmitting || isStepTransitioning}
                    className='min-w-[120px] transition-all duration-200'
                    loading={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Generating...'
                      : currentStep === FORM_STEPS.length
                        ? 'Generate Report'
                        : 'Next'}
                  </Button>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default MultiStepSurveyFormWithWorkflow;
