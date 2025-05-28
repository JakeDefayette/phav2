/**
 * Advanced posture analysis utility functions
 */

import { PostureIssue, PostureRecommendation } from './postureUtils';

export interface PostureAnalysisResult {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: PostureIssue[];
  recommendations: PostureRecommendation[];
  riskFactors: string[];
  progressIndicators: {
    metric: string;
    current: number;
    target: number;
    unit: string;
  }[];
}

export interface PostureAssessmentData {
  headPosition: 'neutral' | 'forward' | 'tilted';
  shoulderAlignment: 'neutral' | 'rounded' | 'elevated' | 'uneven';
  spinalCurvature:
    | 'normal'
    | 'excessive_kyphosis'
    | 'excessive_lordosis'
    | 'scoliosis';
  pelvisPosition: 'neutral' | 'anterior_tilt' | 'posterior_tilt';
  kneeAlignment: 'neutral' | 'valgus' | 'varus';
  footPosition: 'neutral' | 'flat' | 'high_arch' | 'pronated';
  muscleBalance: {
    neckFlexors: 'strong' | 'weak' | 'tight';
    neckExtensors: 'strong' | 'weak' | 'tight';
    chestMuscles: 'strong' | 'weak' | 'tight';
    upperBack: 'strong' | 'weak' | 'tight';
    coreStability: 'strong' | 'weak' | 'tight';
    hipFlexors: 'strong' | 'weak' | 'tight';
  };
  functionalMovement: {
    overheadReach: 'full' | 'limited' | 'compensated';
    spinalRotation: 'full' | 'limited' | 'asymmetric';
    hipMobility: 'full' | 'limited' | 'tight';
    shoulderMobility: 'full' | 'limited' | 'tight';
  };
  painOrDiscomfort: {
    neck: boolean;
    shoulders: boolean;
    upperBack: boolean;
    lowerBack: boolean;
    hips: boolean;
  };
  lifestyle: {
    screenTimeHours: number;
    physicalActivityLevel: 'low' | 'moderate' | 'high';
    sleepPosition: 'back' | 'side' | 'stomach' | 'varies';
    workstationSetup: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

/**
 * Perform comprehensive posture analysis
 */
export function getPostureAnalysis(
  data: PostureAssessmentData,
  ageCategory: 'infant' | 'toddler' | 'preschool' | 'school-age' | 'adolescent'
): PostureAnalysisResult {
  const issues = identifyPostureIssues(data);
  const riskFactors = identifyRiskFactors(data);
  const overallScore = calculateOverallPostureScore(data, issues);
  const grade = getPostureGrade(overallScore);
  const recommendations = generateRecommendations(issues, data, ageCategory);
  const progressIndicators = generateProgressIndicators(data, issues);

  return {
    overallScore,
    grade,
    issues,
    recommendations,
    riskFactors,
    progressIndicators,
  };
}

/**
 * Identify specific posture issues from assessment data
 */
function identifyPostureIssues(data: PostureAssessmentData): PostureIssue[] {
  const issues: PostureIssue[] = [];

  // Head position analysis
  if (data.headPosition === 'forward') {
    issues.push({
      type: 'forward_head',
      severity: determineSeverity(
        data.muscleBalance.neckFlexors,
        data.painOrDiscomfort.neck
      ),
      description: 'Forward head posture detected',
      commonCauses: [
        'Prolonged screen time',
        'Weak deep neck flexors',
        'Poor ergonomics',
      ],
      affectedAreas: [
        'Cervical spine',
        'Upper trapezius',
        'Suboccipital muscles',
      ],
    });
  }

  // Shoulder analysis
  if (data.shoulderAlignment === 'rounded') {
    issues.push({
      type: 'rounded_shoulders',
      severity: determineSeverity(
        data.muscleBalance.chestMuscles,
        data.painOrDiscomfort.shoulders
      ),
      description: 'Rounded shoulder posture identified',
      commonCauses: [
        'Tight pectoral muscles',
        'Weak rhomboids',
        'Poor posture habits',
      ],
      affectedAreas: [
        'Pectoralis major/minor',
        'Rhomboids',
        'Middle trapezius',
      ],
    });
  }

  // Spinal curvature analysis
  if (data.spinalCurvature === 'excessive_kyphosis') {
    issues.push({
      type: 'kyphosis',
      severity: determineSeverity(
        data.muscleBalance.upperBack,
        data.painOrDiscomfort.upperBack
      ),
      description: 'Excessive thoracic kyphosis present',
      commonCauses: [
        'Weak posterior chain',
        'Prolonged sitting',
        'Poor posture awareness',
      ],
      affectedAreas: ['Thoracic spine', 'Erector spinae', 'Posterior deltoids'],
    });
  }

  if (data.spinalCurvature === 'excessive_lordosis') {
    issues.push({
      type: 'lordosis',
      severity: determineSeverity(
        data.muscleBalance.coreStability,
        data.painOrDiscomfort.lowerBack
      ),
      description: 'Excessive lumbar lordosis detected',
      commonCauses: [
        'Weak core muscles',
        'Tight hip flexors',
        'Poor pelvic control',
      ],
      affectedAreas: ['Lumbar spine', 'Hip flexors', 'Abdominal muscles'],
    });
  }

  if (data.spinalCurvature === 'scoliosis') {
    issues.push({
      type: 'scoliosis',
      severity: 'moderate', // Would need more specific assessment
      description: 'Spinal curvature asymmetry observed',
      commonCauses: [
        'Developmental factors',
        'Muscle imbalances',
        'Structural abnormalities',
      ],
      affectedAreas: ['Entire spine', 'Paraspinal muscles', 'Rib cage'],
    });
  }

  // Pelvic analysis
  if (data.pelvisPosition === 'anterior_tilt') {
    issues.push({
      type: 'pelvic_tilt',
      severity: determineSeverity(
        data.muscleBalance.hipFlexors,
        data.painOrDiscomfort.lowerBack
      ),
      description: 'Anterior pelvic tilt identified',
      commonCauses: ['Tight hip flexors', 'Weak glutes', 'Poor core stability'],
      affectedAreas: ['Hip flexors', 'Gluteal muscles', 'Lower abdominals'],
    });
  }

  return issues;
}

/**
 * Determine severity based on muscle balance and pain
 */
function determineSeverity(
  muscleCondition: 'strong' | 'weak' | 'tight',
  hasPain: boolean
): 'mild' | 'moderate' | 'severe' {
  if (hasPain && muscleCondition === 'weak') {
    return 'severe';
  } else if (hasPain || muscleCondition === 'weak') {
    return 'moderate';
  } else {
    return 'mild';
  }
}

/**
 * Identify lifestyle and environmental risk factors
 */
function identifyRiskFactors(data: PostureAssessmentData): string[] {
  const riskFactors: string[] = [];

  if (data.lifestyle.screenTimeHours > 6) {
    riskFactors.push('Excessive screen time (>6 hours/day)');
  }

  if (data.lifestyle.physicalActivityLevel === 'low') {
    riskFactors.push('Insufficient physical activity');
  }

  if (data.lifestyle.workstationSetup === 'poor') {
    riskFactors.push('Poor ergonomic setup');
  }

  if (data.lifestyle.sleepPosition === 'stomach') {
    riskFactors.push('Prone sleeping position');
  }

  if (data.functionalMovement.overheadReach === 'limited') {
    riskFactors.push('Limited shoulder mobility');
  }

  if (data.functionalMovement.spinalRotation === 'asymmetric') {
    riskFactors.push('Asymmetric spinal movement patterns');
  }

  return riskFactors;
}

/**
 * Calculate overall posture score
 */
function calculateOverallPostureScore(
  data: PostureAssessmentData,
  issues: PostureIssue[]
): number {
  let baseScore = 100;

  // Deduct points for each issue
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'mild':
        baseScore -= 5;
        break;
      case 'moderate':
        baseScore -= 15;
        break;
      case 'severe':
        baseScore -= 25;
        break;
    }
  });

  // Additional deductions for lifestyle factors
  if (data.lifestyle.screenTimeHours > 8) {
    baseScore -= 10;
  } else if (data.lifestyle.screenTimeHours > 6) {
    baseScore -= 5;
  }

  if (data.lifestyle.physicalActivityLevel === 'low') {
    baseScore -= 10;
  }

  if (data.lifestyle.workstationSetup === 'poor') {
    baseScore -= 10;
  }

  return Math.max(0, baseScore);
}

/**
 * Get letter grade based on score
 */
function getPostureGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate specific recommendations based on analysis
 */
function generateRecommendations(
  issues: PostureIssue[],
  data: PostureAssessmentData,
  ageCategory: string
): PostureRecommendation[] {
  const recommendations: PostureRecommendation[] = [];

  // Add issue-specific recommendations
  issues.forEach(issue => {
    switch (issue.type) {
      case 'forward_head':
        recommendations.push({
          id: 'chin-tucks',
          title: 'Chin Tuck Exercises',
          description: 'Strengthen deep neck flexors and improve head position',
          category: 'exercise',
          priority: 'high',
          duration: '10 repetitions',
          frequency: '3 times daily',
          instructions: [
            'Sit with back straight against wall',
            'Gently draw chin back toward neck',
            'Hold for 5 seconds',
            'Repeat 10 times',
          ],
        });
        break;

      case 'rounded_shoulders':
        recommendations.push({
          id: 'wall-slides',
          title: 'Wall Slide Exercise',
          description: 'Improve shoulder blade mobility and strength',
          category: 'exercise',
          priority: 'high',
          duration: '10-15 repetitions',
          frequency: '2 times daily',
          instructions: [
            'Stand with back against wall',
            'Place arms in "goal post" position',
            'Slide arms up and down wall',
            'Keep contact with wall throughout',
          ],
        });
        break;
    }
  });

  // Add lifestyle recommendations
  if (data.lifestyle.screenTimeHours > 6) {
    recommendations.push({
      id: 'screen-breaks',
      title: 'Regular Screen Breaks',
      description: 'Implement the 20-20-20 rule for eye and posture health',
      category: 'lifestyle',
      priority: 'medium',
      instructions: [
        'Every 20 minutes, look at something 20 feet away',
        'Hold for at least 20 seconds',
        'Stand and stretch during breaks',
        'Set reminders to maintain consistency',
      ],
    });
  }

  return recommendations;
}

/**
 * Generate progress tracking indicators
 */
function generateProgressIndicators(
  data: PostureAssessmentData,
  issues: PostureIssue[]
): Array<{
  metric: string;
  current: number;
  target: number;
  unit: string;
}> {
  const indicators = [];

  // Screen time indicator
  if (data.lifestyle.screenTimeHours > 6) {
    indicators.push({
      metric: 'Daily Screen Time',
      current: data.lifestyle.screenTimeHours,
      target: 6,
      unit: 'hours',
    });
  }

  // Pain reduction indicator
  const painAreas = Object.values(data.painOrDiscomfort).filter(Boolean).length;
  if (painAreas > 0) {
    indicators.push({
      metric: 'Pain-Free Areas',
      current: 5 - painAreas,
      target: 5,
      unit: 'areas',
    });
  }

  // Exercise compliance (placeholder)
  indicators.push({
    metric: 'Weekly Exercise Sessions',
    current: 0, // Would be tracked over time
    target: 5,
    unit: 'sessions',
  });

  return indicators;
}
