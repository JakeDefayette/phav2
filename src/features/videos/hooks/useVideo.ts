'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoService } from '../services/VideoService';
import { Video, UseVideoReturn } from '../types';

export const useVideo = (id: string | null): UseVideoReturn => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideo = useCallback(async () => {
    if (!id) {
      setVideo(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await VideoService.getVideo({ id });
      setVideo(response.video);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch video';
      setError(errorMessage);
      console.error('Error fetching video:', err);
      setVideo(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const refresh = useCallback(() => {
    fetchVideo();
  }, [fetchVideo]);

  return {
    video,
    loading,
    error,
    refresh,
  };
};
