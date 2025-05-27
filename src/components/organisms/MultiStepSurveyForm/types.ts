// Survey form data types based on docs/form_req.md

export interface SurveyFormData {
  // Step 1: Lifestyle Stressors
  lifestyleStressors: string[];

  // Step 2: Symptoms
  symptoms: string[];

  // Step 3: Contact Information & Report Delivery
  parentFirstName: string;
  parentLastName: string;
  childFirstName: string;
  childLastName: string;
  childAge: string;
  childGender: 'male' | 'female' | 'other' | '';
  email: string;
  phone?: string;
  privacyPolicyAcknowledged: boolean;
  medicalDisclaimerAcknowledged: boolean;
}

export interface FormStep {
  id: number;
  title: string;
  description?: string;
}

export const FORM_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'Lifestyle Stressors',
    description: 'Select all that apply',
  },
  {
    id: 2,
    title: 'Symptoms',
    description: 'Select all that apply',
  },
  {
    id: 3,
    title: 'Contact & Consent',
    description: 'Complete your information',
  },
];

// Initial form values
export const INITIAL_VALUES: SurveyFormData = {
  lifestyleStressors: [],
  symptoms: [],
  parentFirstName: '',
  parentLastName: '',
  childFirstName: '',
  childLastName: '',
  childAge: '',
  childGender: '',
  email: '',
  phone: '',
  privacyPolicyAcknowledged: false,
  medicalDisclaimerAcknowledged: false,
};
