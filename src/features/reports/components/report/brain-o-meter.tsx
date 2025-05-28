import React from 'react';
import { cn } from '@/utils/cn';

interface BrainOMeterProps {
  score: number;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const BrainOMeter: React.FC<BrainOMeterProps> = ({
  score,
  className,
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981',
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return secondaryColor; // Green for good scores
    if (score >= 60) return '#F59E0B'; // Yellow for moderate scores
    return '#EF4444'; // Red for low scores
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <h3 className='text-xl font-bold mb-4' style={{ color: primaryColor }}>
        Brain-O-Meter™ Score
      </h3>

      <div className='relative'>
        <svg width='120' height='120' className='transform -rotate-90'>
          {/* Background circle */}
          <circle
            cx='60'
            cy='60'
            r='45'
            stroke='#E5E7EB'
            strokeWidth='8'
            fill='transparent'
          />

          {/* Progress circle */}
          <circle
            cx='60'
            cy='60'
            r='45'
            stroke={getScoreColor(score)}
            strokeWidth='8'
            fill='transparent'
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
            className='transition-all duration-1000 ease-out'
          />
        </svg>

        {/* Score text in center */}
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          <span
            className='text-2xl font-bold'
            style={{ color: getScoreColor(score) }}
          >
            {score}
          </span>
          <span className='text-sm text-gray-600'>out of 100</span>
        </div>
      </div>

      <div className='mt-4 text-center'>
        <div
          className='text-lg font-semibold mb-2'
          style={{ color: getScoreColor(score) }}
        >
          {getScoreLabel(score)}
        </div>
        <p className='text-sm text-gray-600 max-w-xs'>
          This score reflects your child's overall neurological wellness based
          on the assessment responses.
        </p>
      </div>

      {/* Score interpretation */}
      <div className='mt-6 w-full max-w-sm'>
        <div className='text-sm space-y-2'>
          <div className='flex items-center justify-between'>
            <span>80-100:</span>
            <span className='font-medium' style={{ color: secondaryColor }}>
              Excellent
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span>60-79:</span>
            <span className='font-medium text-yellow-600'>Good</span>
          </div>
          <div className='flex items-center justify-between'>
            <span>40-59:</span>
            <span className='font-medium text-orange-600'>Fair</span>
          </div>
          <div className='flex items-center justify-between'>
            <span>0-39:</span>
            <span className='font-medium text-red-600'>Needs Attention</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Default export for lazy loading
export default BrainOMeter;
