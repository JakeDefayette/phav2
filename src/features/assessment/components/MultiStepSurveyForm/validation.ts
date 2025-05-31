import * as Yup from 'yup';

// Step 1: Lifestyle Stressors validation
export const step1ValidationSchema = Yup.object({
  lifestyleStressors: Yup.array()
    .of(Yup.string())
    .min(1, 'Please select at least one lifestyle stressor'),
});

// Step 2: Symptoms validation
export const step2ValidationSchema = Yup.object({
  symptoms: Yup.array()
    .of(Yup.string())
    .min(1, 'Please select at least one symptom'),
});

// Step 3: Contact Information validation
export const step3ValidationSchema = Yup.object({
  parentFirstName: Yup.string()
    .trim()
    .required('Parent/Guardian first name is required')
    .min(2, 'First name must be at least 2 characters'),

  parentLastName: Yup.string()
    .trim()
    .required('Parent/Guardian last name is required')
    .min(2, 'Last name must be at least 2 characters'),

  childFirstName: Yup.string()
    .trim()
    .required("Child's first name is required")
    .min(2, 'First name must be at least 2 characters'),

  childLastName: Yup.string()
    .trim()
    .required("Child's last name is required")
    .min(2, 'Last name must be at least 2 characters'),

  childAge: Yup.string()
    .required("Child's age is required")
    .matches(/^\d+$/, 'Age must be a number')
    .test('age-range', 'Age must be between 0 and 18', value => {
      if (!value) return false;
      const age = parseInt(value, 10);
      return age >= 0 && age <= 18;
    }),

  childGender: Yup.string()
    .required("Child's gender is required")
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender'),

  email: Yup.string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address'),

  phone: Yup.string()
    .trim()
    .nullable()
    .test(
      'phone-format',
      'Please enter a valid phone number',
      function (value) {
        // If value is empty or undefined, it's valid (optional field)
        if (!value || value.length === 0) {
          return true;
        }
        // If value exists, validate format
        return /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/.test(
          value
        );
      }
    ),

  privacyPolicyAcknowledged: Yup.boolean()
    .required('You must acknowledge the privacy policy')
    .oneOf([true], 'You must acknowledge the privacy policy'),

  medicalDisclaimerAcknowledged: Yup.boolean()
    .required('You must acknowledge the medical disclaimer')
    .oneOf([true], 'You must acknowledge the medical disclaimer'),
});

// Complete form validation schema
export const completeValidationSchema = Yup.object({
  ...step1ValidationSchema.fields,
  ...step2ValidationSchema.fields,
  ...step3ValidationSchema.fields,
});

// Get validation schema for a specific step
export const getValidationSchemaForStep = (step: number) => {
  switch (step) {
    case 1:
      return step1ValidationSchema;
    case 2:
      return step2ValidationSchema;
    case 3:
      return step3ValidationSchema;
    default:
      return completeValidationSchema;
  }
};
