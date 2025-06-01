'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoService } from '../services/VideoService';
import { VideoSummary, VideoSearchFilters, UseVideosReturn } from '../types';

export const useVideos = (
  initialFilters: VideoSearchFilters = {}
): UseVideosReturn => {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<VideoSearchFilters>(initialFilters);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await VideoService.getVideos({
        page,
        limit: 20,
        filters,
      });

      setVideos(response.videos);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch videos';
      setError(errorMessage);
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const updateFilters = useCallback((newFilters: VideoSearchFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const refresh = useCallback(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    total,
    page,
    totalPages,
    filters,
    setFilters: updateFilters,
    nextPage,
    previousPage,
    refresh,
  };
};
