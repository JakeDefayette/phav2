'use client';

import { useState, useCallback } from 'react';
import { VideoService } from '../services/VideoService';
import {
  Video,
  VideoFormData,
  UseVideoMutationsReturn,
  VideosAPI,
} from '../types';

export const useVideoMutations = (): UseVideoMutationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = useCallback(
    async (data: VideoFormData & { file: File }): Promise<Video> => {
      try {
        setLoading(true);
        setError(null);
        setUploadProgress(0);

        const { file, ...videoData } = data;

        const response = await VideoService.uploadVideo(
          { video: videoData, file },
          (progress: VideosAPI.UploadProgressEvent) => {
            setUploadProgress(progress.percentage);
          }
        );

        setUploadProgress(100);
        return response.video;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload video';
        setError(errorMessage);
        console.error('Error uploading video:', err);
        throw err;
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    []
  );

  const updateVideo = useCallback(
    async (id: string, updates: Partial<VideoFormData>): Promise<Video> => {
      try {
        setLoading(true);
        setError(null);

        const response = await VideoService.updateVideo({ id, updates });
        return response.video;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update video';
        setError(errorMessage);
        console.error('Error updating video:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteVideo = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await VideoService.deleteVideo({ id });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete video';
      setError(errorMessage);
      console.error('Error deleting video:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadVideo,
    updateVideo,
    deleteVideo,
    loading,
    error,
    uploadProgress,
  };
};
