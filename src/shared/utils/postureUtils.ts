/**
 * Posture analysis and recommendation utility functions
 */

export interface PostureRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'exercise' | 'lifestyle' | 'ergonomic' | 'therapeutic';
  priority: 'high' | 'medium' | 'low';
  duration?: string;
  frequency?: string;
  instructions?: string[];
}

export interface PostureIssue {
  type:
    | 'forward_head'
    | 'rounded_shoulders'
    | 'kyphosis'
    | 'lordosis'
    | 'scoliosis'
    | 'pelvic_tilt';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  commonCauses: string[];
  affectedAreas: string[];
}

/**
 * Get posture recommendations based on assessment data
 */
export function getPostureRecommendations(
  issues: PostureIssue[],
  ageCategory: 'infant' | 'toddler' | 'preschool' | 'school-age' | 'adolescent'
): PostureRecommendation[] {
  const recommendations: PostureRecommendation[] = [];

  issues.forEach(issue => {
    switch (issue.type) {
      case 'forward_head':
        recommendations.push({
          id: 'fh-neck-stretch',
          title: 'Neck Stretches',
          description:
            'Gentle neck stretches to counteract forward head posture',
          category: 'exercise',
          priority: issue.severity === 'severe' ? 'high' : 'medium',
          duration: '30 seconds',
          frequency: '3 times daily',
          instructions: [
            'Sit or stand with spine straight',
            'Gently tuck chin back toward neck',
            'Hold for 30 seconds',
            'Repeat 5 times',
          ],
        });
        break;

      case 'rounded_shoulders':
        recommendations.push({
          id: 'rs-doorway-stretch',
          title: 'Doorway Chest Stretch',
          description: 'Open chest muscles to improve shoulder alignment',
          category: 'exercise',
          priority: 'medium',
          duration: '30-60 seconds',
          frequency: '2-3 times daily',
          instructions: [
            'Stand in doorway with arms at 90 degrees',
            'Step forward gently until stretch is felt',
            'Hold for 30-60 seconds',
            'Breathe deeply throughout',
          ],
        });
        break;

      case 'kyphosis':
        recommendations.push({
          id: 'kyph-thoracic-extension',
          title: 'Thoracic Extension Exercises',
          description: 'Strengthen upper back to reduce excessive kyphosis',
          category: 'exercise',
          priority: 'high',
          duration: '10-15 minutes',
          frequency: 'Daily',
          instructions: [
            'Lie face down with arms extended',
            'Lift chest and arms off ground',
            'Hold for 5 seconds',
            'Repeat 10-15 times',
          ],
        });
        break;

      case 'scoliosis':
        recommendations.push({
          id: 'scol-professional-eval',
          title: 'Professional Evaluation',
          description:
            'Consult with healthcare provider for scoliosis management',
          category: 'therapeutic',
          priority: 'high',
          instructions: [
            'Schedule appointment with pediatric orthopedist',
            'Consider physical therapy evaluation',
            'Monitor progression with regular check-ups',
          ],
        });
        break;
    }
  });

  // Add age-appropriate general recommendations
  if (ageCategory === 'school-age' || ageCategory === 'adolescent') {
    recommendations.push({
      id: 'ergonomic-setup',
      title: 'Ergonomic Workspace Setup',
      description: 'Optimize study and computer workspace for better posture',
      category: 'ergonomic',
      priority: 'medium',
      instructions: [
        'Adjust chair height so feet are flat on floor',
        'Position screen at eye level',
        'Keep elbows at 90-degree angle when typing',
        'Take breaks every 30 minutes',
      ],
    });
  }

  return recommendations;
}

/**
 * Analyze posture based on assessment responses
 */
export function analyzePosture(responses: Record<string, any>): PostureIssue[] {
  const issues: PostureIssue[] = [];

  // Example analysis logic - would be more sophisticated in real implementation
  if (responses.head_position === 'forward') {
    issues.push({
      type: 'forward_head',
      severity: responses.head_severity || 'mild',
      description: 'Head positioned forward of shoulders',
      commonCauses: [
        'Poor ergonomics',
        'Excessive screen time',
        'Weak neck muscles',
      ],
      affectedAreas: [
        'Cervical spine',
        'Upper trapezius',
        'Suboccipital muscles',
      ],
    });
  }

  if (responses.shoulder_position === 'rounded') {
    issues.push({
      type: 'rounded_shoulders',
      severity: responses.shoulder_severity || 'mild',
      description: 'Shoulders rolled forward and inward',
      commonCauses: [
        'Tight chest muscles',
        'Weak upper back',
        'Poor posture habits',
      ],
      affectedAreas: ['Pectoralis muscles', 'Rhomboids', 'Middle trapezius'],
    });
  }

  if (responses.spinal_curvature === 'excessive_kyphosis') {
    issues.push({
      type: 'kyphosis',
      severity: responses.kyphosis_severity || 'moderate',
      description: 'Excessive outward curvature of upper spine',
      commonCauses: [
        'Poor posture',
        'Weak back muscles',
        'Developmental factors',
      ],
      affectedAreas: ['Thoracic spine', 'Erector spinae', 'Posterior deltoids'],
    });
  }

  return issues;
}

/**
 * Get posture score based on identified issues
 */
export function calculatePostureScore(issues: PostureIssue[]): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  description: string;
} {
  if (issues.length === 0) {
    return {
      score: 95,
      grade: 'A',
      description: 'Excellent posture with no significant issues identified',
    };
  }

  let totalDeduction = 0;
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'mild':
        totalDeduction += 5;
        break;
      case 'moderate':
        totalDeduction += 15;
        break;
      case 'severe':
        totalDeduction += 25;
        break;
    }
  });

  const score = Math.max(0, 100 - totalDeduction);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let description: string;

  if (score >= 90) {
    grade = 'A';
    description = 'Excellent posture with minor areas for improvement';
  } else if (score >= 80) {
    grade = 'B';
    description = 'Good posture with some areas needing attention';
  } else if (score >= 70) {
    grade = 'C';
    description = 'Fair posture with several areas requiring improvement';
  } else if (score >= 60) {
    grade = 'D';
    description = 'Poor posture with significant issues that need addressing';
  } else {
    grade = 'F';
    description =
      'Very poor posture requiring immediate professional attention';
  }

  return { score, grade, description };
}

/**
 * Get exercise difficulty level based on age
 */
export function getExerciseDifficulty(
  ageCategory: string
): 'beginner' | 'intermediate' | 'advanced' {
  switch (ageCategory) {
    case 'infant':
    case 'toddler':
      return 'beginner';
    case 'preschool':
    case 'school-age':
      return 'intermediate';
    case 'adolescent':
      return 'advanced';
    default:
      return 'beginner';
  }
}
