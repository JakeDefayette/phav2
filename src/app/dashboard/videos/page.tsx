'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/shared/hooks';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard/RoleGuard';
import {
  VideoLibrary,
  VideoUploader,
  useVideos,
  useVideoMutations,
} from '@/features/videos';
import {
  Video,
  VideoSearchFilters,
  VideoCategory,
  VideoVisibility,
} from '@/features/videos/types';
import { Button } from '@/shared/components/atoms/Button/Button';
import { FormField } from '@/shared/components/molecules/FormField/FormField';
import { Card } from '@/shared/components/molecules/Card/Card';
import { Alert } from '@/shared/components/molecules/Alert/Alert';
import { useRouter } from 'next/navigation';

export default function VideosPage() {
  const router = useRouter();
  const [showUploader, setShowUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Prepare filters
  const filters: VideoSearchFilters = {
    search: searchTerm || undefined,
    category: (selectedCategory as VideoCategory) || undefined,
    visibility: (selectedVisibility as VideoVisibility) || undefined,
  };

  const { videos, loading, error, page, totalPages, nextPage, refresh } =
    useVideos(filters);

  const {
    uploadVideo,
    deleteVideo,
    loading: mutationLoading,
    error: mutationError,
    uploadProgress,
  } = useVideoMutations();

  const handleVideoSelect = useCallback(
    (video: Video) => {
      router.push(`/dashboard/videos/${video.id}`);
    },
    [router]
  );

  const handleVideoEdit = useCallback(
    (video: Video) => {
      router.push(`/dashboard/videos/${video.id}/edit`);
    },
    [router]
  );

  const handleVideoDelete = useCallback(
    async (video: Video) => {
      if (
        !confirm(
          `Are you sure you want to delete "${video.title}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await deleteVideo(video.id);
        setUploadSuccess(`Video "${video.title}" has been deleted.`);
        refresh();
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    },
    [deleteVideo, refresh]
  );

  const handleUpload = useCallback(
    async (data: any) => {
      try {
        const uploadedVideo = await uploadVideo(data);
        setUploadSuccess(
          `Video "${uploadedVideo.title}" uploaded successfully!`
        );
        setShowUploader(false);
        refresh();
      } catch (error) {
        console.error('Error uploading video:', error);
      }
    },
    [uploadVideo, refresh]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedVisibility('');
  }, []);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'educational', label: 'Educational' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'patient_instructions', label: 'Patient Instructions' },
    { value: 'exercise_demonstrations', label: 'Exercise Demonstrations' },
    { value: 'office_tour', label: 'Office Tour' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'other', label: 'Other' },
  ];

  const visibilityOptions = [
    { value: '', label: 'All Visibility' },
    { value: 'private', label: 'Private' },
    { value: 'practice', label: 'Practice' },
    { value: 'public', label: 'Public' },
  ];

  if (showUploader) {
    return (
      <RoleGuard allowedRoles={['admin', 'practitioner']}>
        <DashboardLayout>
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Upload Video
                </h1>
                <p className='text-gray-600'>
                  Add educational or promotional videos to your practice library
                </p>
              </div>
              <Button
                variant='secondary'
                onClick={() => setShowUploader(false)}
              >
                Back to Library
              </Button>
            </div>

            {mutationError && <Alert variant='error'>{mutationError}</Alert>}

            <VideoUploader
              onUpload={handleUpload}
              onCancel={() => setShowUploader(false)}
              loading={mutationLoading}
              progress={uploadProgress}
              error={mutationError}
            />
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'practitioner']}>
      <DashboardLayout>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Video Library
              </h1>
              <p className='text-gray-600'>
                Manage your educational and promotional videos
              </p>
            </div>
            <Button variant='primary' onClick={() => setShowUploader(true)}>
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              Upload Video
            </Button>
          </div>

          {/* Success Message */}
          {uploadSuccess && (
            <Alert
              variant='success'
              onDismiss={() => setUploadSuccess(null)}
              dismissible
            >
              {uploadSuccess}
            </Alert>
          )}

          {/* Filters */}
          <Card className='p-6'>
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Filter Videos
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <FormField
                  label='Search'
                  type='text'
                  placeholder='Search videos...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />

                <div className='space-y-1'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='space-y-1'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Visibility
                  </label>
                  <select
                    value={selectedVisibility}
                    onChange={e => setSelectedVisibility(e.target.value)}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                  >
                    {visibilityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex items-end'>
                  <Button
                    variant='secondary'
                    onClick={clearFilters}
                    className='w-full'
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Video Library */}
          <VideoLibrary
            videos={videos}
            loading={loading}
            error={error}
            onVideoSelect={handleVideoSelect}
            onVideoEdit={handleVideoEdit}
            onVideoDelete={handleVideoDelete}
          />

          {/* Load More Button */}
          {page < totalPages && (
            <div className='flex justify-center pt-6'>
              <Button variant='secondary' onClick={nextPage} loading={loading}>
                Load More Videos
              </Button>
            </div>
          )}

          {/* Empty State Helper */}
          {videos.length === 0 && !loading && !error && (
            <Card className='p-8 text-center'>
              <div className='max-w-md mx-auto'>
                <div className='w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-8 h-8 text-blue-600'
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
                  Start Building Your Video Library
                </h3>
                <p className='text-gray-600 mb-6'>
                  Upload educational videos, patient instructions, or
                  promotional content to enhance your practice.
                </p>
                <Button variant='primary' onClick={() => setShowUploader(true)}>
                  Upload Your First Video
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
