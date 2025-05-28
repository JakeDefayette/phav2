import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface Step {
  id: number;
  title: string;
  description?: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className='flex items-center justify-between'>
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className='flex flex-col items-center'>
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                    {
                      'border-blue-600 bg-blue-600 text-white': isActive,
                      'border-green-600 bg-green-600 text-white': isCompleted,
                      'border-gray-300 bg-white text-gray-500':
                        !isActive && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className='h-4 w-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                {/* Step Label */}
                <div className='mt-2 text-center'>
                  <p
                    className={cn('text-sm font-medium', {
                      'text-blue-600': isActive,
                      'text-green-600': isCompleted,
                      'text-gray-500': !isActive && !isCompleted,
                    })}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className='text-xs text-gray-400 mt-1'>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn('flex-1 h-0.5 mx-4 mt-4', {
                    'bg-green-600': isCompleted,
                    'bg-blue-600': isActive && index < steps.length - 1,
                    'bg-gray-300': !isCompleted && !isActive,
                  })}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
