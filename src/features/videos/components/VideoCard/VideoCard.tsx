'use client';

import React from 'react';
import { VideoCardProps } from '../../types';
import { Card } from '@/shared/components/molecules/Card/Card';
import { Button } from '@/shared/components/atoms/Button/Button';
import { VideoService } from '../../services/VideoService';

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onEdit,
  onDelete,
  onView,
  className = '',
}) => {
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--';
    return VideoService.formatDuration(seconds);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '--';
    return VideoService.formatFileSize(bytes);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      educational: 'bg-blue-100 text-blue-800',
      promotional: 'bg-purple-100 text-purple-800',
      patient_instructions: 'bg-green-100 text-green-800',
      exercise_demonstrations: 'bg-orange-100 text-orange-800',
      office_tour: 'bg-indigo-100 text-indigo-800',
      testimonials: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category || 'other'] || colors.other;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      ready: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      uploading: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.ready;
  };

  const getVisibilityIcon = (visibility: string): React.ReactElement => {
    switch (visibility) {
      case 'private':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
            />
          </svg>
        );
      case 'practice':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
            />
          </svg>
        );
      case 'public':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
      default:
        return <></>;
    }
  };

  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Video Thumbnail */}
      <div className='relative aspect-video bg-gray-200 overflow-hidden'>
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200'>
            <svg
              className='w-12 h-12 text-gray-400'
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
        )}

        {/* Duration Overlay */}
        {video.duration && (
          <div className='absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded'>
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Status Badge */}
        {video.upload_status !== 'ready' && (
          <div className='absolute top-2 left-2'>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(video.upload_status)}`}
            >
              {video.upload_status}
            </span>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-colors duration-200'>
          <button
            onClick={() => onView?.(video)}
            className='w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100'
            disabled={video.upload_status !== 'ready'}
          >
            <svg
              className='w-5 h-5 text-gray-800 ml-0.5'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M8 5v14l11-7z' />
            </svg>
          </button>
        </div>
      </div>

      {/* Video Content */}
      <div className='p-4'>
        {/* Title and Description */}
        <div className='mb-3'>
          <h3 className='font-medium text-gray-900 line-clamp-2 mb-1'>
            {video.title}
          </h3>
          {video.description && (
            <p className='text-sm text-gray-600 line-clamp-2'>
              {video.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className='space-y-2 mb-4'>
          {/* Category and Visibility */}
          <div className='flex items-center justify-between'>
            {video.category && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(video.category)}`}
              >
                {video.category.replace('_', ' ')}
              </span>
            )}
            <div className='flex items-center text-gray-500'>
              {getVisibilityIcon(video.visibility)}
              <span className='ml-1 text-xs capitalize'>
                {video.visibility}
              </span>
            </div>
          </div>

          {/* File Size and Upload Date */}
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <span>{formatFileSize(video.file_size)}</span>
            <span>{formatDate(video.created_at)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-2'>
          <Button
            variant='primary'
            size='sm'
            onClick={() => onView?.(video)}
            disabled={video.upload_status !== 'ready'}
            className='flex-1'
          >
            <svg
              className='w-4 h-4 mr-1'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 4a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h14z'
              />
            </svg>
            View
          </Button>

          {onEdit && (
            <Button
              variant='secondary'
              size='sm'
              onClick={() => onEdit(video)}
              className='px-3'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
            </Button>
          )}

          {onDelete && (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => onDelete(video)}
              className='px-3'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
