/**
 * Optimized Image Component
 *
 * Wrapper around Next.js Image component with additional optimizations
 * and consistent styling across the application.
 */

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/shared/utils/cn';

/**
 * Props for the OptimizedImage component
 */
export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  /** Image source URL or static import */
  src: string | StaticImageData;
  /** Alt text for accessibility (required) */
  alt: string;
  /** Additional CSS classes */
  className?: string;
  /** Fallback image URL if primary image fails to load */
  fallbackSrc?: string;
  /** Whether to show a loading placeholder */
  showPlaceholder?: boolean;
  /** Custom placeholder component */
  placeholder?: React.ReactNode;
  /** Image aspect ratio (for responsive sizing) */
  aspectRatio?: 'square' | '4/3' | '16/9' | '3/2' | 'auto';
  /** Whether to use blur placeholder */
  useBlurPlaceholder?: boolean;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Size optimization preset */
  sizePreset?: 'thumbnail' | 'small' | 'medium' | 'large' | 'hero';
}

/**
 * Static image data type
 */
interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

/**
 * Size presets for common use cases
 */
const sizePresets = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  hero: { width: 1920, height: 1080 },
};

/**
 * Aspect ratio classes
 */
const aspectRatioClasses = {
  square: 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '16/9': 'aspect-video',
  '3/2': 'aspect-[3/2]',
  auto: '',
};

/**
 * Optimized Image Component with Next.js optimizations
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   sizePreset="hero"
 *   aspectRatio="16/9"
 *   useBlurPlaceholder
 * />
 * ```
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc,
  showPlaceholder = true,
  placeholder,
  aspectRatio = 'auto',
  useBlurPlaceholder = true,
  loading = 'lazy',
  sizePreset,
  quality = 85,
  priority = false,
  fill = false,
  sizes,
  width,
  height,
  ...props
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  // Get dimensions from size preset if provided
  const presetDimensions = sizePreset ? sizePresets[sizePreset] : null;
  const finalWidth = width || presetDimensions?.width;
  const finalHeight = height || presetDimensions?.height;

  // Handle image load error
  const handleError = () => {
    setImageError(true);
    setImageLoading(false);
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setImageError(false);
    }
  };

  // Handle image load success
  const handleLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Generate sizes attribute for responsive images
  const generateSizes = (): string => {
    if (sizes) return sizes;

    if (sizePreset) {
      switch (sizePreset) {
        case 'thumbnail':
          return '(max-width: 768px) 100vw, 150px';
        case 'small':
          return '(max-width: 768px) 100vw, 300px';
        case 'medium':
          return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px';
        case 'large':
          return '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px';
        case 'hero':
          return '100vw';
        default:
          return '100vw';
      }
    }

    return '100vw';
  };

  // Build CSS classes
  const imageClasses = cn(
    'transition-opacity duration-300',
    aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
    imageLoading && 'opacity-0',
    !imageLoading && 'opacity-100',
    className
  );

  // Render error state
  if (imageError && !fallbackSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-200 text-gray-500',
          aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
          className
        )}
        style={{ width: finalWidth, height: finalHeight }}
      >
        <div className='text-center'>
          <svg
            className='mx-auto h-8 w-8 text-gray-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <p className='mt-2 text-sm'>Image not available</p>
        </div>
      </div>
    );
  }

  // Render loading placeholder
  const renderPlaceholder = () => {
    if (placeholder) return placeholder;

    if (!showPlaceholder) return null;

    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse',
          aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio]
        )}
      >
        <svg
          className='h-8 w-8 text-gray-400'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      </div>
    );
  };

  return (
    <div className='relative'>
      {imageLoading && renderPlaceholder()}

      <Image
        src={imgSrc}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        quality={quality}
        priority={priority}
        loading={loading}
        fill={fill}
        sizes={generateSizes()}
        placeholder={useBlurPlaceholder ? 'blur' : 'empty'}
        blurDataURL={
          useBlurPlaceholder
            ? 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
            : undefined
        }
        className={imageClasses}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

/**
 * Avatar component with optimized image loading
 */
export interface AvatarProps
  extends Omit<OptimizedImageProps, 'aspectRatio' | 'sizePreset'> {
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** User's name for fallback initials */
  name?: string;
}

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  name,
  className,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);

  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  if (imageError || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-500 text-white font-semibold rounded-full',
          avatarSizes[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio='square'
      className={cn('rounded-full object-cover', avatarSizes[size], className)}
      onError={() => setImageError(true)}
      {...props}
    />
  );
};

export default OptimizedImage;
