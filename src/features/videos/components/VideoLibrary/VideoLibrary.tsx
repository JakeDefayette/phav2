'use client';

import React from 'react';
import { VideoLibraryProps } from '../../types';
import { VideoCard } from '../VideoCard/VideoCard';
import { Loading } from '@/shared/components/atoms/Loading/Loading';
import { Alert } from '@/shared/components/molecules/Alert/Alert';

export const VideoLibrary: React.FC<VideoLibraryProps> = ({
  videos,
  loading = false,
  error = null,
  onVideoSelect,
  onVideoEdit,
  onVideoDelete,
  className = '',
}) => {
  if (loading && videos.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loading size='lg' text='Loading videos...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant='error'>
          <div className='flex items-center justify-between'>
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className='text-sm text-red-800 hover:text-red-900 underline'
            >
              Retry
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className='max-w-md mx-auto'>
          <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No videos yet
          </h3>
          <p className='text-gray-600 mb-6'>
            Start building your video library by uploading your first
            educational or promotional video.
          </p>
          <div className='space-y-2 text-sm text-gray-500'>
            <p>💡 Tips for great videos:</p>
            <ul className='text-left space-y-1 max-w-xs mx-auto'>
              <li>• Keep videos under 10 minutes for better engagement</li>
              <li>• Use clear, descriptive titles</li>
              <li>• Add relevant tags for easy searching</li>
              <li>• Include captions for accessibility</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Video Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onView={onVideoSelect}
            onEdit={onVideoEdit}
            onDelete={onVideoDelete}
            className='h-full'
          />
        ))}
      </div>

      {/* Loading Overlay for Additional Pages */}
      {loading && videos.length > 0 && (
        <div className='flex items-center justify-center py-8'>
          <Loading size='md' text='Loading more videos...' />
        </div>
      )}
    </div>
  );
};
