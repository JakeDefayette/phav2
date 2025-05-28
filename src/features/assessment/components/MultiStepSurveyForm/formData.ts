import { CheckboxOption, RadioOption } from '@/shared/components/molecules';

// Step 1: Lifestyle Stressors options
export const LIFESTYLE_STRESSOR_OPTIONS: CheckboxOption[] = [
  {
    value: 'birth-trauma',
    label: 'Birth Trauma',
    description: 'Difficult birth, C-section, or forceps delivery',
  },
  {
    value: 'digital-devices',
    label: 'Digital Devices',
    description: "Regular screen time or 'tech neck' posture",
  },
  {
    value: 'sports-physical-activity',
    label: 'Sports/Physical Activity',
    description: 'Active in sports or physical activities',
  },
  {
    value: 'emotional-stress',
    label: 'Emotional Stress',
    description: 'School pressure, family changes, anxiety',
  },
  {
    value: 'poor-posture',
    label: 'Poor Posture',
    description: 'Slouching, heavy backpack, poor ergonomics',
  },
  {
    value: 'falls-accidents',
    label: 'Falls/Accidents',
    description: 'Recent falls, accidents, or injuries',
  },
  {
    value: 'sleep-issues',
    label: 'Sleep Issues',
    description: 'Trouble falling asleep or staying asleep',
  },
  {
    value: 'dietary-concerns',
    label: 'Dietary Concerns',
    description: 'Processed foods, sugar, allergies',
  },
];

// Step 2: Symptoms options
export const SYMPTOM_OPTIONS: CheckboxOption[] = [
  {
    value: 'headaches',
    label: 'Headaches',
    description: 'Regular or recurring headaches',
  },
  {
    value: 'focus-attention-issues',
    label: 'Focus/Attention Issues',
    description: 'Difficulty concentrating or staying focused',
  },
  {
    value: 'sleeping-problems',
    label: 'Sleeping Problems',
    description: 'Trouble falling asleep or staying asleep',
  },
  {
    value: 'allergies-sinus-issues',
    label: 'Allergies/Sinus Issues',
    description: 'Chronic allergies or sinus congestion',
  },
  {
    value: 'digestive-problems',
    label: 'Digestive Problems',
    description: 'Constipation, diarrhea, or stomach pain',
  },
  {
    value: 'behavioral-challenges',
    label: 'Behavioral Challenges',
    description: 'Tantrums, irritability, or mood swings',
  },
  {
    value: 'recurring-illness',
    label: 'Recurring Illness',
    description: 'Frequent colds, ear infections, or illness',
  },
  {
    value: 'poor-posture-symptoms',
    label: 'Poor Posture',
    description: 'Slouching, rounded shoulders, or forward head',
  },
  {
    value: 'back-neck-pain',
    label: 'Back/Neck Pain',
    description: 'Complains of back or neck discomfort',
  },
];

// Step 3: Gender options
export const GENDER_OPTIONS: RadioOption[] = [
  {
    value: 'male',
    label: 'Male',
  },
  {
    value: 'female',
    label: 'Female',
  },
  {
    value: 'other',
    label: 'Other',
  },
];
