'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/shared/utils/cn';

export type TransitionDirection = 'forward' | 'backward';
export type TransitionType = 'slide' | 'fade' | 'scale';

export interface StepTransitionProps {
  /** Current step content */
  children: React.ReactNode;
  /** Current step number */
  currentStep: number;
  /** Transition direction */
  direction?: TransitionDirection;
  /** Whether transition is currently active */
  isTransitioning?: boolean;
  /** Type of transition animation */
  type?: TransitionType;
  /** Duration of transition in milliseconds */
  duration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when transition completes */
  onTransitionComplete?: () => void;
}

export const StepTransition: React.FC<StepTransitionProps> = ({
  children,
  currentStep,
  direction = 'forward',
  isTransitioning = false,
  type = 'slide',
  duration = 300,
  className,
  onTransitionComplete,
}) => {
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [content, setContent] = useState(children);

  useEffect(() => {
    if (currentStep !== displayStep) {
      // Wait for exit animation
      const exitTimer = setTimeout(() => {
        setDisplayStep(currentStep);
        setContent(children);

        // Wait for enter animation
        const enterTimer = setTimeout(() => {
          onTransitionComplete?.();
        }, 50);

        return () => clearTimeout(enterTimer);
      }, duration / 2);

      return () => clearTimeout(exitTimer);
    }
  }, [currentStep, displayStep, children, duration, onTransitionComplete]);

  const getTransitionClasses = () => {
    const baseClasses = 'transition-all ease-in-out';
    const durationClass = `duration-${duration}`;

    switch (type) {
      case 'slide':
        if (isTransitioning) {
          return cn(
            baseClasses,
            durationClass,
            direction === 'forward'
              ? '-translate-x-full opacity-0'
              : 'translate-x-full opacity-0'
          );
        }
        return cn(baseClasses, durationClass, 'translate-x-0 opacity-100');

      case 'fade':
        return cn(
          baseClasses,
          durationClass,
          isTransitioning ? 'opacity-0' : 'opacity-100'
        );

      case 'scale':
        return cn(
          baseClasses,
          durationClass,
          isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        );

      default:
        return baseClasses;
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className={getTransitionClasses()}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {content}
      </div>
    </div>
  );
};

// Convenience hook for managing step transitions
export const useStepTransition = (initialStep = 0) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState<TransitionDirection>('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToStep = (newStep: number) => {
    if (newStep === currentStep || isTransitioning) return;

    setDirection(newStep > currentStep ? 'forward' : 'backward');
    setIsTransitioning(true);
    setCurrentStep(newStep);
  };

  const nextStep = () => goToStep(currentStep + 1);
  const previousStep = () => goToStep(currentStep - 1);

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  return {
    currentStep,
    direction,
    isTransitioning,
    goToStep,
    nextStep,
    previousStep,
    handleTransitionComplete,
  };
};
