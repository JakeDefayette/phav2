// Type definitions for jest-axe custom matcher and utilities
// This ensures TypeScript recognizes the 'jest-axe' module and its matcher

declare module 'jest-axe' {
  import { MatcherFunction } from '@testing-library/jest-dom';
  import { AxeResults } from 'axe-core';

  // Primary exported function used to run axe against rendered HTML
  export function axe(html: any, options?: any): Promise<AxeResults>;

  // Custom matcher that extends Jest's expect
  export const toHaveNoViolations: MatcherFunction<[AxeResults]>;
}

// Extend the Jest Matchers interface to include the custom matcher
declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}
