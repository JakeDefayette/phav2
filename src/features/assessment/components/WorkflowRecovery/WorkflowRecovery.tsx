'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  Play,
  Clock,
} from 'lucide-react';
import { Button } from '@/shared/components/atoms/Button';
import { Card } from '@/shared/components/molecules/Card';
import { cn } from '@/shared/utils/cn';
import {
  WorkflowState,
  WorkflowError,
  WorkflowRecoveryOptions,
} from '../../services/workflowStateManager';

export interface WorkflowRecoveryProps {
  /** Current workflow state */
  state: WorkflowState;
  /** Whether recovery actions are loading */
  isLoading?: boolean;
  /** Callback when user wants to resume session */
  onResume?: () => Promise<void>;
  /** Callback when user wants to recover from errors */
  onRecover?: (options: WorkflowRecoveryOptions) => Promise<boolean>;
  /** Callback when user wants to start fresh */
  onStartFresh?: () => Promise<void>;
  /** Callback when user wants to clear everything */
  onClearAll?: () => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

interface RecoveryOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
  variant: 'primary' | 'secondary' | 'destructive';
  recoveryOptions?: WorkflowRecoveryOptions;
}

/**
 * Component for displaying workflow recovery options
 */
export function WorkflowRecovery({
  state,
  isLoading = false,
  onResume,
  onRecover,
  onStartFresh,
  onClearAll,
  className,
}: WorkflowRecoveryProps): React.JSX.Element {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const hasErrors = state.errors.length > 0;
  const hasRecoverableErrors = state.errors.some(e => e.recoverable);
  const hasFormData = Object.keys(state.formData).length > 0;
  const isOldSession =
    new Date().getTime() - new Date(state.lastUpdatedAt).getTime() >
    60 * 60 * 1000; // 1 hour

  // Determine what recovery options to show
  const getRecoveryOptions = (): RecoveryOption[] => {
    const options: RecoveryOption[] = [];

    // Resume if no errors and has data
    if (!hasErrors && hasFormData && onResume) {
      options.push({
        id: 'resume',
        title: 'Resume Assessment',
        description: 'Continue where you left off with your saved progress',
        icon: <Play className='h-5 w-5' />,
        action: async () => {
          setSelectedOption('resume');
          setIsRecovering(true);
          try {
            await onResume();
          } finally {
            setIsRecovering(false);
            setSelectedOption(null);
          }
        },
        variant: 'primary',
      });
    }

    // Quick recovery for recoverable errors
    if (hasRecoverableErrors && onRecover) {
      options.push({
        id: 'quick-recover',
        title: 'Quick Recovery',
        description: 'Clear recent errors and continue with your data',
        icon: <RefreshCw className='h-5 w-5' />,
        action: async () => {
          setSelectedOption('quick-recover');
          setIsRecovering(true);
          try {
            await onRecover({ clearErrors: true, preserveFormData: true });
          } finally {
            setIsRecovering(false);
            setSelectedOption(null);
          }
        },
        variant: 'primary',
        recoveryOptions: { clearErrors: true, preserveFormData: true },
      });
    }

    // Reset to previous step for form errors
    if (hasErrors && state.currentStep > 1 && onRecover) {
      options.push({
        id: 'reset-step',
        title: 'Go Back One Step',
        description: 'Return to the previous step and keep your data',
        icon: <RotateCcw className='h-5 w-5' />,
        action: async () => {
          setSelectedOption('reset-step');
          setIsRecovering(true);
          try {
            await onRecover({
              clearErrors: true,
              resetStep: true,
              preserveFormData: true,
            });
          } finally {
            setIsRecovering(false);
            setSelectedOption(null);
          }
        },
        variant: 'secondary',
        recoveryOptions: {
          clearErrors: true,
          resetStep: true,
          preserveFormData: true,
        },
      });
    }

    // Start fresh but preserve essential data
    if (hasFormData && onRecover) {
      options.push({
        id: 'soft-reset',
        title: 'Restart with Key Info',
        description: 'Keep your contact details but clear form responses',
        icon: <RotateCcw className='h-5 w-5' />,
        action: async () => {
          setSelectedOption('soft-reset');
          setIsRecovering(true);
          try {
            await onRecover({
              clearErrors: true,
              resetStep: true,
              preserveFormData: false,
            });
          } finally {
            setIsRecovering(false);
            setSelectedOption(null);
          }
        },
        variant: 'secondary',
        recoveryOptions: {
          clearErrors: true,
          resetStep: true,
          preserveFormData: false,
        },
      });
    }

    // Start completely fresh
    if (onStartFresh) {
      options.push({
        id: 'start-fresh',
        title: 'Start Over',
        description: 'Begin a new assessment from the beginning',
        icon: <Play className='h-5 w-5' />,
        action: async () => {
          setSelectedOption('start-fresh');
          setIsRecovering(true);
          try {
            await onStartFresh();
          } finally {
            setIsRecovering(false);
            setSelectedOption(null);
          }
        },
        variant: 'secondary',
      });
    }

    // Clear everything
    if (onClearAll) {
      options.push({
        id: 'clear-all',
        title: 'Clear All Data',
        description: 'Remove all saved progress and start fresh',
        icon: <Trash2 className='h-5 w-5' />,
        action: async () => {
          setSelectedOption('clear-all');
          setIsRecovering(true);
          try {
            await onClearAll();
          } finally {
            setIsRecovering(false);
            setSelectedOption(null);
          }
        },
        variant: 'destructive',
      });
    }

    return options;
  };

  const recoveryOptions = getRecoveryOptions();

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Session Info */}
      <Card className='p-6'>
        <div className='flex items-start space-x-4'>
          <div className='flex-shrink-0'>
            <Clock className='h-6 w-6 text-blue-500' />
          </div>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Assessment Session Found
            </h3>
            <div className='mt-2 space-y-1 text-sm text-gray-600'>
              <p>
                <span className='font-medium'>Started:</span>{' '}
                {formatTimeAgo(state.startedAt)}
              </p>
              <p>
                <span className='font-medium'>Last updated:</span>{' '}
                {formatTimeAgo(state.lastUpdatedAt)}
              </p>
              <p>
                <span className='font-medium'>Current step:</span>{' '}
                {state.currentStep} of 3
              </p>
              <p>
                <span className='font-medium'>Progress saved:</span>{' '}
                {state.savedCount} times
              </p>
              {state.isAnonymous && (
                <p className='text-amber-600'>
                  <span className='font-medium'>Mode:</span> Anonymous session
                </p>
              )}
            </div>

            {/* Show saved form data summary */}
            {hasFormData && (
              <div className='mt-3'>
                <h4 className='text-sm font-medium text-gray-700'>
                  Saved Information:
                </h4>
                <div className='mt-1 flex flex-wrap gap-2'>
                  {state.formData.lifestyleStressors &&
                    state.formData.lifestyleStressors.length > 0 && (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        {state.formData.lifestyleStressors.length} lifestyle
                        factors
                      </span>
                    )}
                  {state.formData.symptoms &&
                    state.formData.symptoms.length > 0 && (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                        {state.formData.symptoms.length} symptoms
                      </span>
                    )}
                  {state.formData.parentFirstName && (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                      Parent info
                    </span>
                  )}
                  {state.formData.childFirstName && (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                      Child info
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Errors Display */}
      {hasErrors && (
        <Card className='p-6 border-red-200 bg-red-50'>
          <div className='flex items-start space-x-4'>
            <div className='flex-shrink-0'>
              <AlertCircle className='h-6 w-6 text-red-500' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-red-900'>
                Issues Detected
              </h3>
              <div className='mt-2 space-y-2'>
                {state.errors.slice(-3).map((error, index) => (
                  <div key={index} className='text-sm'>
                    <div className='font-medium text-red-800'>{error.code}</div>
                    <div className='text-red-700'>{error.message}</div>
                    <div className='text-red-600 text-xs'>
                      {formatTimeAgo(error.timestamp)} • Stage: {error.stage}
                      {error.retryAttempts > 0 &&
                        ` • ${error.retryAttempts} retries`}
                      {error.recoverable && (
                        <span className='ml-2 px-1 py-0.5 bg-green-100 text-green-800 rounded'>
                          Recoverable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {state.errors.length > 3 && (
                  <div className='text-xs text-red-600'>
                    ...and {state.errors.length - 3} more errors
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recovery Options */}
      <Card className='p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          What would you like to do?
        </h3>
        <div className='space-y-3'>
          {recoveryOptions.map(option => (
            <Button
              key={option.id}
              variant={option.variant}
              size='lg'
              className='w-full justify-start text-left h-auto p-4'
              onClick={option.action}
              disabled={isLoading || isRecovering}
              loading={selectedOption === option.id && isRecovering}
            >
              <div className='flex items-center space-x-3'>
                <div className='flex-shrink-0'>{option.icon}</div>
                <div className='flex-1'>
                  <div className='font-medium'>{option.title}</div>
                  <div className='text-sm opacity-75 mt-1'>
                    {option.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Additional Info */}
      {isOldSession && (
        <div className='text-center'>
          <div className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800'>
            <AlertCircle className='h-3 w-3 mr-1' />
            This session is over an hour old
          </div>
        </div>
      )}
    </div>
  );
}
