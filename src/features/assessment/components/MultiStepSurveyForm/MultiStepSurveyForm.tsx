import React, { useState } from 'react';
import { Formik, Form, FormikHelpers, Field } from 'formik';
import { Button, Checkbox } from '@/shared/components/atoms';
import {
  StepIndicator,
  CheckboxGroup,
  RadioGroup,
  FormField,
} from '@/shared/components/molecules';
import { cn } from '@/shared/utils/cn';

// Import types and data
import { SurveyFormData, INITIAL_VALUES, FORM_STEPS } from './types';
import { getValidationSchemaForStep } from './validation';
import {
  LIFESTYLE_STRESSOR_OPTIONS,
  SYMPTOM_OPTIONS,
  GENDER_OPTIONS,
} from './formData';

export interface MultiStepSurveyFormProps {
  onSubmit: (values: SurveyFormData) => void | Promise<void>;
  className?: string;
}

export const MultiStepSurveyForm: React.FC<MultiStepSurveyFormProps> = ({
  onSubmit,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async (
    values: SurveyFormData,
    { setFieldTouched, validateForm }: FormikHelpers<SurveyFormData>
  ) => {
    // Validate current step
    const currentStepSchema = getValidationSchemaForStep(currentStep);
    try {
      await currentStepSchema.validate(values, { abortEarly: false });
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Mark fields as touched to show validation errors
      if (currentStep === 1) {
        setFieldTouched('lifestyleStressors', true);
      } else if (currentStep === 2) {
        setFieldTouched('symptoms', true);
      } else if (currentStep === 3) {
        // Mark all step 3 fields as touched
        const step3Fields = [
          'parentFirstName',
          'parentLastName',
          'childFirstName',
          'childLastName',
          'childAge',
          'childGender',
          'email',
          'privacyPolicyAcknowledged',
          'medicalDisclaimerAcknowledged',
        ];
        step3Fields.forEach(field => setFieldTouched(field, true));
      }
      await validateForm();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
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

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      <Formik
        initialValues={INITIAL_VALUES}
        validationSchema={getValidationSchemaForStep(currentStep)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isValid }) => (
          <Form className='space-y-8'>
            {/* Step Indicator */}
            <StepIndicator
              steps={FORM_STEPS}
              currentStep={currentStep}
              className='mb-8'
            />

            {/* Step Content */}
            <div className='min-h-[400px]'>{renderStepContent(values)}</div>

            {/* Navigation Buttons */}
            <div className='flex justify-between pt-6 border-t border-gray-200'>
              <Button
                type='button'
                variant='outline'
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              <Button
                type='submit'
                disabled={isSubmitting}
                className='min-w-[120px]'
              >
                {isSubmitting
                  ? 'Generating...'
                  : currentStep === FORM_STEPS.length
                    ? 'Generate Report'
                    : 'Next'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default MultiStepSurveyForm;
