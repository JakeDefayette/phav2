import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface SkeletonProps {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Additional CSS classes */
  className?: string;
  /** Number of lines for text variant */
  lines?: number;
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
}

const variantClasses = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg',
};

const animationClasses = {
  pulse: 'animate-pulse',
  wave: 'animate-pulse',
  none: '',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  className,
  lines = 1,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';

  // Handle text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses.text,
              animationClasses[animation],
              // Last line is typically shorter
              index === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              width: index === lines - 1 && !width ? '75%' : width,
            }}
          />
        ))}
      </div>
    );
  }

  // Single skeleton element
  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1rem' : '3rem'),
      }}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<
  Pick<SkeletonProps, 'lines' | 'className'>
> = ({ lines = 3, className }) => (
  <Skeleton variant='text' lines={lines} className={className} />
);

export const SkeletonButton: React.FC<Pick<SkeletonProps, 'className'>> = ({
  className,
}) => (
  <Skeleton
    variant='rounded'
    width='120px'
    height='40px'
    className={className}
  />
);

export const SkeletonCard: React.FC<Pick<SkeletonProps, 'className'>> = ({
  className,
}) => (
  <div className={cn('space-y-4 p-4 border rounded-lg', className)}>
    <Skeleton variant='rounded' width='100%' height='200px' />
    <div className='space-y-2'>
      <Skeleton variant='text' width='100%' />
      <Skeleton variant='text' width='80%' />
      <Skeleton variant='text' width='60%' />
    </div>
  </div>
);

export const SkeletonAvatar: React.FC<Pick<SkeletonProps, 'className'>> = ({
  className,
}) => (
  <Skeleton
    variant='circular'
    width='40px'
    height='40px'
    className={className}
  />
);
