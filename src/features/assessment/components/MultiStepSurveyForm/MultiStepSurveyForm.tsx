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
import {
  getValidationSchemaForStep,
  completeValidationSchema,
} from './validation';
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
    console.log(
      '🔄 [MultiStepSurveyForm] handleNext called for step:',
      currentStep
    );
    console.log('📝 [MultiStepSurveyForm] Values being validated:', values);
    console.log(
      '⚠️ [MultiStepSurveyForm] WARNING: handleNext was called instead of proceeding to final submission!'
    );

    // Validate current step
    const currentStepSchema = getValidationSchemaForStep(currentStep);
    console.log(
      '🔍 [MultiStepSurveyForm] Using validation schema for step:',
      currentStep
    );

    try {
      await currentStepSchema.validate(values, { abortEarly: false });
      console.log(
        '✅ [MultiStepSurveyForm] Validation successful for step:',
        currentStep
      );
      console.log(
        '➡️ [MultiStepSurveyForm] Moving to next step:',
        currentStep + 1
      );
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error(
        '❌ [MultiStepSurveyForm] Validation failed for step:',
        currentStep
      );
      console.error('📋 [MultiStepSurveyForm] Validation errors:', error);
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
    console.log('🔥 === MULTISTEP FORM SUBMISSION TRIGGERED ===');
    console.log(
      '[MultiStepSurveyForm] handleSubmit called. Current step:',
      currentStep,
      'Total steps:',
      FORM_STEPS.length
    );
    console.log('[MultiStepSurveyForm] Form values:', values);
    console.log(
      '[MultiStepSurveyForm] Button state - isSubmitting:',
      isSubmitting
    );
    console.log('[MultiStepSurveyForm] Step comparison:', {
      currentStep,
      totalSteps: FORM_STEPS.length,
      isLastStep: currentStep === FORM_STEPS.length,
      condition: currentStep < FORM_STEPS.length,
    });

    // ENHANCED DEBUG: Add detailed button and form state information
    console.log('[MultiStepSurveyForm] 🔍 DETAILED STATE DEBUG:', {
      currentStepIs: currentStep,
      FORM_STEPS_length: FORM_STEPS.length,
      buttonText:
        currentStep === FORM_STEPS.length ? 'Generate Report' : 'Next',
      isLastStepCalculation: `${currentStep} === ${FORM_STEPS.length} = ${currentStep === FORM_STEPS.length}`,
      willCallHandleNext: currentStep < FORM_STEPS.length,
      willCallOnSubmit: currentStep >= FORM_STEPS.length,
    });

    // ENHANCED DEBUG: Let's check form validation status
    console.log(
      '[MultiStepSurveyForm] 🔍 ENHANCED DEBUG - Current form state:',
      {
        values: {
          lifestyleStressors: values.lifestyleStressors?.length || 0,
          symptoms: values.symptoms?.length || 0,
          parentFirstName: !!values.parentFirstName,
          parentLastName: !!values.parentLastName,
          childFirstName: !!values.childFirstName,
          childLastName: !!values.childLastName,
          childAge: !!values.childAge,
          childGender: !!values.childGender,
          email: !!values.email,
          privacyPolicyAcknowledged: values.privacyPolicyAcknowledged,
          medicalDisclaimerAcknowledged: values.medicalDisclaimerAcknowledged,
        },
      }
    );

    if (currentStep < FORM_STEPS.length) {
      console.log(
        '[MultiStepSurveyForm] ❌ Not the last step, calling handleNext.'
      );
      await handleNext(values, helpers);
    } else {
      console.log(
        '[MultiStepSurveyForm] ✅ Last step detected, calling onSubmit prop.'
      );

      // Validate the final step before proceeding
      const finalStepSchema = getValidationSchemaForStep(currentStep);
      console.log(
        '[MultiStepSurveyForm] 🔍 About to validate final step with schema for step:',
        currentStep
      );

      try {
        await finalStepSchema.validate(values, { abortEarly: false });
        console.log(
          '[MultiStepSurveyForm] ✅ Final step validation PASSED - proceeding to onSubmit'
        );
      } catch (validationError: any) {
        console.error(
          '[MultiStepSurveyForm] ❌ Final step validation FAILED:',
          validationError
        );
        console.error('[MultiStepSurveyForm] 📋 Validation error details:', {
          errors: validationError?.errors || [],
          inner: validationError?.inner || [],
          message: validationError?.message,
          path: validationError?.path,
        });

        // Mark all fields as touched to show validation errors
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
        step3Fields.forEach(field => helpers.setFieldTouched(field, true));
        await helpers.validateForm();
        console.log(
          '[MultiStepSurveyForm] ⚠️ Validation failed - NOT calling onSubmit, returning early'
        );
        return; // Don't proceed with submission
      }

      console.log(
        '[MultiStepSurveyForm] 🚀 All validations passed, setting isSubmitting=true and calling onSubmit...'
      );
      setIsSubmitting(true);
      try {
        await onSubmit(values);
        console.log(
          '[MultiStepSurveyForm] ✅ onSubmit prop finished successfully.'
        );
      } catch (error) {
        console.error(
          '[MultiStepSurveyForm] ❌ Error during onSubmit prop execution:',
          error
        );
      } finally {
        setIsSubmitting(false);
        console.log(
          '[MultiStepSurveyForm] 🔄 setIsSubmitting(false) in finally block.'
        );
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
                <Field name='parentFirstName'>
                  {({ field, meta }: any) => (
                    <FormField
                      {...field}
                      label='Parent/Guardian First Name'
                      required
                      error={
                        meta.touched && meta.error ? meta.error : undefined
                      }
                    />
                  )}
                </Field>
                <Field name='parentLastName'>
                  {({ field, meta }: any) => (
                    <FormField
                      {...field}
                      label='Parent/Guardian Last Name'
                      required
                      error={
                        meta.touched && meta.error ? meta.error : undefined
                      }
                    />
                  )}
                </Field>
              </div>
            </div>

            {/* Child Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Child Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field name='childFirstName'>
                  {({ field, meta }: any) => (
                    <FormField
                      {...field}
                      label="Child's First Name"
                      required
                      error={
                        meta.touched && meta.error ? meta.error : undefined
                      }
                    />
                  )}
                </Field>
                <Field name='childLastName'>
                  {({ field, meta }: any) => (
                    <FormField
                      {...field}
                      label="Child's Last Name"
                      required
                      error={
                        meta.touched && meta.error ? meta.error : undefined
                      }
                    />
                  )}
                </Field>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field name='childAge'>
                  {({ field, meta }: any) => (
                    <FormField
                      {...field}
                      label="Child's Age"
                      type='number'
                      min='0'
                      max='18'
                      required
                      error={
                        meta.touched && meta.error ? meta.error : undefined
                      }
                    />
                  )}
                </Field>
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
                <Field name='email'>
                  {({ field, meta }: any) => (
                    <FormField
                      {...field}
                      label='Email Address'
                      type='email'
                      placeholder='your@email.com'
                      required
                      error={
                        meta.touched && meta.error ? meta.error : undefined
                      }
                    />
                  )}
                </Field>
                <Field name='phone'>
                  {({ field, meta }: any) => (
                    <FormField
                      {...field}
                      label='Mobile Phone Number (Optional)'
                      type='tel'
                      placeholder='(123) 456-7890'
                      error={
                        meta.touched && meta.error ? meta.error : undefined
                      }
                    />
                  )}
                </Field>
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
                          name={field.name}
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
                          name={field.name}
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
        validationSchema={
          currentStep === FORM_STEPS.length
            ? completeValidationSchema
            : getValidationSchemaForStep(currentStep)
        }
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          isValid,
          handleSubmit: formikHandleSubmit,
          errors,
          touched,
        }) => {
          console.log('🔄 [FORMIK RENDER] Component re-rendering with state:', {
            currentStep,
            isValid,
            isSubmitting,
            formikHandleSubmit: typeof formikHandleSubmit,
            errors: Object.keys(errors),
            touchedFields: Object.keys(touched),
            hasErrors: Object.keys(errors).length > 0,
          });

          return (
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

                <div className='flex gap-2'>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='min-w-[120px]'
                    onClick={e => {
                      console.log(
                        '🟡 [BUTTON DEBUG] Generate Report button clicked!'
                      );
                      console.log(
                        '🟡 [BUTTON DEBUG] Current step:',
                        currentStep
                      );
                      console.log(
                        '🟡 [BUTTON DEBUG] Button text should be:',
                        currentStep === FORM_STEPS.length
                          ? 'Generate Report'
                          : 'Next'
                      );
                      console.log(
                        '🟡 [BUTTON DEBUG] isSubmitting:',
                        isSubmitting
                      );
                      console.log('🟡 [BUTTON DEBUG] Form validation state:', {
                        isValid,
                        hasErrors: Object.keys(errors).length > 0,
                        errors: errors,
                        actualValues: {
                          parentFirstName: values.parentFirstName,
                          parentLastName: values.parentLastName,
                          childFirstName: values.childFirstName,
                          childLastName: values.childLastName,
                          childAge: values.childAge,
                          childGender: values.childGender,
                          email: values.email,
                          phone: values.phone,
                          privacyPolicy: values.privacyPolicyAcknowledged,
                          medicalDisclaimer:
                            values.medicalDisclaimerAcknowledged,
                          lifestyleStressors: values.lifestyleStressors,
                          symptoms: values.symptoms,
                        },
                      });
                      console.log('🟡 [BUTTON DEBUG] Event:', e);
                      // Don't prevent default - let form submission happen naturally
                    }}
                  >
                    {isSubmitting
                      ? 'Generating...'
                      : currentStep === FORM_STEPS.length
                        ? 'Generate Report'
                        : 'Next'}
                  </Button>

                  {currentStep === FORM_STEPS.length && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={async () => {
                        console.log(
                          '🔧 [DIRECT SUBMIT DEBUG] Direct submit button clicked!'
                        );
                        console.log(
                          '🔧 [DIRECT SUBMIT DEBUG] Calling formikHandleSubmit directly...'
                        );
                        try {
                          await formikHandleSubmit();
                          console.log(
                            '🔧 [DIRECT SUBMIT DEBUG] formikHandleSubmit completed'
                          );
                        } catch (error) {
                          console.error(
                            '🔧 [DIRECT SUBMIT DEBUG] Error in formikHandleSubmit:',
                            error
                          );
                        }
                      }}
                      className='min-w-[120px]'
                    >
                      Debug Submit
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default MultiStepSurveyForm;
