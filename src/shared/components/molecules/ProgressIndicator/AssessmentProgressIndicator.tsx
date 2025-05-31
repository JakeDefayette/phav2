import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type {
  AssessmentProgress,
  AssessmentStage,
  ProgressError,
} from '@/features/assessment/types/progress';

interface AssessmentProgressIndicatorProps {
  progress: AssessmentProgress | null;
  error?: ProgressError | null;
  showTimeEstimate?: boolean;
  showStageDetails?: boolean;
  compact?: boolean;
  className?: string;
}

const stageDisplayNames: Record<AssessmentStage, string> = {
  validating: 'Validating',
  saving_responses: 'Saving Responses',
  completing_assessment: 'Completing Assessment',
  generating_report: 'Generating Report',
  finalizing: 'Finalizing',
  completed: 'Completed',
  error: 'Error',
};

const stageIcons: Record<
  AssessmentStage,
  React.ComponentType<{ className?: string }>
> = {
  validating: Clock,
  saving_responses: Loader2,
  completing_assessment: Loader2,
  generating_report: Loader2,
  finalizing: Loader2,
  completed: CheckCircle,
  error: AlertCircle,
};

function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) return '< 1s';

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getProgressBarColor(
  stage: AssessmentStage,
  hasError: boolean
): string {
  if (hasError || stage === 'error') return 'bg-red-500';
  if (stage === 'completed') return 'bg-green-500';
  return 'bg-blue-500';
}

function getProgressBarStyle(progress: number): React.CSSProperties {
  return {
    width: `${Math.max(0, Math.min(100, progress))}%`,
    transition: 'width 0.3s ease-in-out',
  };
}

export function AssessmentProgressIndicator({
  progress,
  error,
  showTimeEstimate = true,
  showStageDetails = true,
  compact = false,
  className = '',
}: AssessmentProgressIndicatorProps): React.ReactElement | null {
  if (!progress) {
    return null;
  }

  const hasError = !!error || progress.stage === 'error' || !!progress.error;
  const isCompleted = progress.stage === 'completed';
  const progressPercentage = progress.progress || 0;
  const IconComponent = stageIcons[progress.stage];

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className='flex items-center space-x-2'>
          <IconComponent
            className={`h-4 w-4 ${
              hasError
                ? 'text-red-500'
                : isCompleted
                  ? 'text-green-500'
                  : 'text-blue-500 animate-spin'
            }`}
          />
          <span className='text-sm font-medium'>{progress.currentStep}</span>
        </div>
        <div className='flex-1 bg-gray-200 rounded-full h-2'>
          <div
            className={`h-2 rounded-full ${getProgressBarColor(progress.stage, hasError)}`}
            style={getProgressBarStyle(progressPercentage)}
          />
        </div>
        <span className='text-sm text-gray-600 font-mono'>
          {progressPercentage.toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-3'>
          <IconComponent
            className={`h-6 w-6 ${
              hasError
                ? 'text-red-500'
                : isCompleted
                  ? 'text-green-500'
                  : 'text-blue-500 animate-spin'
            }`}
          />
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              {stageDisplayNames[progress.stage]}
            </h3>
            <p className='text-sm text-gray-600'>{progress.currentStep}</p>
          </div>
        </div>
        <div className='text-right'>
          <div className='text-2xl font-bold text-gray-900'>
            {progressPercentage.toFixed(0)}%
          </div>
          {showTimeEstimate &&
            progress.estimatedTimeRemaining !== undefined &&
            progress.estimatedTimeRemaining > 0 && (
              <div className='text-sm text-gray-600'>
                ~{formatTime(progress.estimatedTimeRemaining)} remaining
              </div>
            )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className='mb-4'>
        <div className='flex justify-between text-sm text-gray-600 mb-2'>
          <span>Progress</span>
          <span>
            {progress.completedSteps} of {progress.totalSteps} steps
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-3'>
          <div
            className={`h-3 rounded-full ${getProgressBarColor(progress.stage, hasError)}`}
            style={getProgressBarStyle(progressPercentage)}
          />
        </div>
      </div>

      {/* Stage Details */}
      {showStageDetails && (
        <div className='grid grid-cols-5 gap-2 mb-4'>
          {(
            [
              'validating',
              'saving_responses',
              'completing_assessment',
              'generating_report',
              'finalizing',
            ] as AssessmentStage[]
          ).map((stage, index) => {
            const isCurrentStage = progress.stage === stage;
            const isCompletedStage = progress.completedSteps > index;
            const isErrorStage = hasError && isCurrentStage;

            return (
              <div
                key={stage}
                className={`text-center p-2 rounded-lg border transition-colors ${
                  isErrorStage
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : isCurrentStage
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : isCompletedStage
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <div className='text-xs font-medium'>
                  {stageDisplayNames[stage]}
                </div>
                <div className='mt-1'>
                  {isErrorStage ? (
                    <AlertCircle className='h-4 w-4 mx-auto' />
                  ) : isCompletedStage ? (
                    <CheckCircle className='h-4 w-4 mx-auto' />
                  ) : isCurrentStage ? (
                    <Loader2 className='h-4 w-4 mx-auto animate-spin' />
                  ) : (
                    <div className='h-4 w-4 mx-auto bg-current rounded-full opacity-30' />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Display */}
      {hasError && (error || progress.error) && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='h-5 w-5 text-red-500 mt-0.5 flex-shrink-0' />
            <div>
              <h4 className='text-sm font-semibold text-red-800'>
                {(error || progress.error)?.code}
              </h4>
              <p className='text-sm text-red-700 mt-1'>
                {(error || progress.error)?.message}
              </p>
              {(error || progress.error)?.recoverable && (
                <p className='text-xs text-red-600 mt-2'>
                  This error may be temporary. Please try again.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {isCompleted && !hasError && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center space-x-3'>
            <CheckCircle className='h-5 w-5 text-green-500' />
            <div>
              <h4 className='text-sm font-semibold text-green-800'>
                Assessment Completed Successfully
              </h4>
              <p className='text-sm text-green-700 mt-1'>
                Your assessment has been processed and your report is ready.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
