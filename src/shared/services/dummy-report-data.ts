// Dummy data for demo report
export const dummyContactInfo = {
  parentFirstName: 'Sarah',
  parentLastName: 'Johnson',
  childFirstName: 'Emma',
  childLastName: 'Johnson',
  childAge: 8,
  email: 'sarah.johnson@email.com',
  phone: '(555) 123-4567',
};

export const dummyOfficeInfo = {
  name: 'Pediatric Wellness Center',
  address: '123 Main Street, Anytown, ST 12345',
  phone: '(555) 987-6543',
  hours: 'Mon-Fri 9AM-5PM, Sat 9AM-2PM',
  email: 'info@pediatricwellness.com',
  website: 'www.pediatricwellness.com',
};

export const dummyBrainScore = 7.5;

export const dummyAffectedRegions: SpinalRegion[] = ['cervical', 'thoracic'];

export const dummySymptomsByRegion: Record<SpinalRegion, string[]> = {
  cervical: ['headaches', 'neck_pain', 'concentration_issues'],
  thoracic: ['back_pain', 'breathing_issues'],
  lumbar: [],
};

export const symptomLabels: Record<string, string> = {
  headaches: 'Frequent headaches',
  neck_pain: 'Neck pain and stiffness',
  concentration_issues: 'Difficulty concentrating',
  back_pain: 'Upper back pain',
  breathing_issues: 'Breathing difficulties',
  lower_back_pain: 'Lower back pain',
  hip_pain: 'Hip discomfort',
  leg_pain: 'Leg pain or numbness',
};

export const dummyRecommendations = [
  {
    id: '1',
    title: 'Comprehensive Spinal Evaluation',
    description:
      'A thorough examination to assess spinal alignment and identify specific areas of concern.',
    priority: 'high' as const,
    category: 'evaluation' as const,
  },
  {
    id: '2',
    title: 'Postural Assessment',
    description:
      "Evaluate Emma's posture during daily activities to identify contributing factors.",
    priority: 'medium' as const,
    category: 'assessment' as const,
  },
  {
    id: '3',
    title: 'Ergonomic School Setup',
    description:
      "Review and optimize Emma's desk and chair setup at school and home.",
    priority: 'medium' as const,
    category: 'lifestyle' as const,
  },
  {
    id: '4',
    title: 'Gentle Corrective Exercises',
    description:
      'Age-appropriate exercises to improve spinal alignment and strengthen supporting muscles.',
    priority: 'high' as const,
    category: 'treatment' as const,
  },
];

export type SpinalRegion = 'cervical' | 'thoracic' | 'lumbar';
export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationCategory =
  | 'evaluation'
  | 'assessment'
  | 'lifestyle'
  | 'treatment';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
}
