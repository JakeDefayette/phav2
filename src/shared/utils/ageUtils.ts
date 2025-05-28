/**
 * Age calculation utility functions
 */

/**
 * Calculate age in years from a birth date
 */
export function calculateAge(birthDate: string | Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate age in months (useful for infants/toddlers)
 */
export function calculateAgeInMonths(birthDate: string | Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();

  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months += today.getMonth() - birth.getMonth();

  if (today.getDate() < birth.getDate()) {
    months--;
  }

  return Math.max(0, months);
}

/**
 * Get a formatted age string (e.g., "2 years, 3 months" or "8 months")
 */
export function getFormattedAge(birthDate: string | Date): string {
  const ageInMonths = calculateAgeInMonths(birthDate);

  if (ageInMonths < 12) {
    return `${ageInMonths} month${ageInMonths === 1 ? '' : 's'}`;
  }

  const years = Math.floor(ageInMonths / 12);
  const remainingMonths = ageInMonths % 12;

  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }

  return `${years} year${years === 1 ? '' : 's'}, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
}

/**
 * Get age category for pediatric assessments
 */
export function getAgeCategory(
  birthDate: string | Date
): 'infant' | 'toddler' | 'preschool' | 'school-age' | 'adolescent' {
  const ageInMonths = calculateAgeInMonths(birthDate);

  if (ageInMonths < 12) {
    return 'infant';
  } else if (ageInMonths < 36) {
    return 'toddler';
  } else if (ageInMonths < 60) {
    return 'preschool';
  } else if (ageInMonths < 144) {
    // 12 years
    return 'school-age';
  } else {
    return 'adolescent';
  }
}

/**
 * Check if a child is within a specific age range (in months)
 */
export function isInAgeRange(
  birthDate: string | Date,
  minMonths: number,
  maxMonths: number
): boolean {
  const ageInMonths = calculateAgeInMonths(birthDate);
  return ageInMonths >= minMonths && ageInMonths <= maxMonths;
}

/**
 * Get developmental milestones age ranges
 */
export function getDevelopmentalStage(birthDate: string | Date): {
  stage: string;
  description: string;
  ageRange: string;
} {
  const ageInMonths = calculateAgeInMonths(birthDate);

  if (ageInMonths < 3) {
    return {
      stage: 'newborn',
      description: 'Newborn development phase',
      ageRange: '0-3 months',
    };
  } else if (ageInMonths < 6) {
    return {
      stage: 'early-infant',
      description: 'Early infant development',
      ageRange: '3-6 months',
    };
  } else if (ageInMonths < 12) {
    return {
      stage: 'late-infant',
      description: 'Late infant development',
      ageRange: '6-12 months',
    };
  } else if (ageInMonths < 24) {
    return {
      stage: 'early-toddler',
      description: 'Early toddler development',
      ageRange: '1-2 years',
    };
  } else if (ageInMonths < 36) {
    return {
      stage: 'late-toddler',
      description: 'Late toddler development',
      ageRange: '2-3 years',
    };
  } else if (ageInMonths < 60) {
    return {
      stage: 'preschool',
      description: 'Preschool development',
      ageRange: '3-5 years',
    };
  } else if (ageInMonths < 144) {
    return {
      stage: 'school-age',
      description: 'School-age development',
      ageRange: '5-12 years',
    };
  } else {
    return {
      stage: 'adolescent',
      description: 'Adolescent development',
      ageRange: '12+ years',
    };
  }
}
