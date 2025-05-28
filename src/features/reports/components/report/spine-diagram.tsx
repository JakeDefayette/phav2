import React from 'react';
import { cn } from '@/utils/cn';

interface SpineDiagramProps {
  cervicalHighlighted?: boolean;
  thoracicHighlighted?: boolean;
  lumbarHighlighted?: boolean;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const SpineDiagram: React.FC<SpineDiagramProps> = ({
  cervicalHighlighted = false,
  thoracicHighlighted = false,
  lumbarHighlighted = false,
  className,
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981',
}) => {
  const getRegionColor = (isHighlighted: boolean) => {
    if (isHighlighted) {
      return secondaryColor;
    }
    return '#E5E7EB';
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width='120'
        height='300'
        viewBox='0 0 120 300'
        className='spine-diagram'
      >
        {/* Cervical Region */}
        <g>
          <rect
            x='40'
            y='20'
            width='40'
            height='60'
            rx='8'
            fill={getRegionColor(cervicalHighlighted)}
            stroke={primaryColor}
            strokeWidth='2'
          />
          <text
            x='60'
            y='55'
            textAnchor='middle'
            className='text-xs font-medium'
            fill='#374151'
          >
            C1-C7
          </text>
        </g>

        {/* Thoracic Region */}
        <g>
          <rect
            x='35'
            y='90'
            width='50'
            height='120'
            rx='8'
            fill={getRegionColor(thoracicHighlighted)}
            stroke={primaryColor}
            strokeWidth='2'
          />
          <text
            x='60'
            y='155'
            textAnchor='middle'
            className='text-xs font-medium'
            fill='#374151'
          >
            T1-T12
          </text>
        </g>

        {/* Lumbar Region */}
        <g>
          <rect
            x='40'
            y='220'
            width='40'
            height='60'
            rx='8'
            fill={getRegionColor(lumbarHighlighted)}
            stroke={primaryColor}
            strokeWidth='2'
          />
          <text
            x='60'
            y='255'
            textAnchor='middle'
            className='text-xs font-medium'
            fill='#374151'
          >
            L1-L5
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className='mt-4 space-y-2 text-sm'>
        <div className='flex items-center space-x-2'>
          <div
            className='w-4 h-4 rounded border-2'
            style={{
              backgroundColor: getRegionColor(true),
              borderColor: primaryColor,
            }}
          />
          <span className='text-gray-700'>Areas of Concern</span>
        </div>
        <div className='flex items-center space-x-2'>
          <div
            className='w-4 h-4 rounded border-2'
            style={{
              backgroundColor: getRegionColor(false),
              borderColor: primaryColor,
            }}
          />
          <span className='text-gray-700'>Normal Areas</span>
        </div>
      </div>
    </div>
  );
};

// Default export for lazy loading
export default SpineDiagram;
