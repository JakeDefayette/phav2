import { supabase } from '@/lib/supabase';
import {
  Video,
  VideoSummary,
  VideoFormData,
  VideoSearchFilters,
  VideoCategory,
  VideoVisibility,
  VideoUploadStatus,
  VideosAPI,
} from '../types';

export class VideoService {
  private static readonly STORAGE_BUCKET = 'videos';
  private static readonly THUMBNAILS_BUCKET = 'thumbnails';
  private static readonly MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  private static readonly ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
  ];

  /**
   * Get paginated list of videos with filtering
   */
  static async getVideos(
    request: VideosAPI.ListRequest
  ): Promise<VideosAPI.ListResponse> {
    try {
      const { page = 1, limit = 20, filters = {} } = request;
      const offset = (page - 1) * limit;

      let query = supabase.from('videos').select(
        `
          id,
          title,
          description,
          thumbnail_url,
          duration,
          category,
          visibility,
          upload_status,
          created_at,
          file_size
        `,
        { count: 'exact' }
      );

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      if (filters.status) {
        query = query.eq('upload_status', filters.status);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch videos: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        videos: data as Video[],
        total: count || 0,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }

  /**
   * Get a single video by ID
   */
  static async getVideo(
    request: VideosAPI.GetRequest
  ): Promise<VideosAPI.GetResponse> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', request.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch video: ${error.message}`);
      }

      if (!data) {
        throw new Error('Video not found');
      }

      return { video: data as Video };
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  }

  /**
   * Upload a video with file and metadata
   */
  static async uploadVideo(
    request: VideosAPI.CreateRequest,
    onProgress?: (event: VideosAPI.UploadProgressEvent) => void
  ): Promise<VideosAPI.CreateResponse> {
    try {
      const { file, video } = request;

      // Validate file
      this.validateVideoFile(file);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const filename = `${user.id}/${Date.now()}.${fileExtension}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(this.STORAGE_BUCKET).getPublicUrl(filename);

      // Create video record in database
      const videoData: Omit<Video, 'id' | 'created_at' | 'updated_at'> = {
        title: video.title,
        description: video.description,
        filename: filename,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        tags: video.tags,
        category: video.category,
        visibility: video.visibility,
        upload_status: 'processing',
        created_by: user.id,
        practice_id: user.user_metadata?.practice_id || user.id,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('videos')
        .insert([videoData])
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.STORAGE_BUCKET).remove([filename]);

        throw new Error(`Failed to create video record: ${dbError.message}`);
      }

      // Update status to ready (in a real app, this might be done by a background process)
      const { data: finalVideo, error: updateError } = await supabase
        .from('videos')
        .update({ upload_status: 'ready' })
        .eq('id', dbData.id)
        .select()
        .single();

      if (updateError) {
        console.warn('Failed to update video status:', updateError);
      }

      return { video: finalVideo || (dbData as Video) };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Update video metadata
   */
  static async updateVideo(
    request: VideosAPI.UpdateRequest
  ): Promise<VideosAPI.UpdateResponse> {
    try {
      const { id, updates } = request;

      const { data, error } = await supabase
        .from('videos')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update video: ${error.message}`);
      }

      return { video: data as Video };
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  /**
   * Delete a video and its associated files
   */
  static async deleteVideo(
    request: VideosAPI.DeleteRequest
  ): Promise<VideosAPI.DeleteResponse> {
    try {
      const { id } = request;

      // First get the video to find the filename
      const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('filename, thumbnail_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(
          `Failed to fetch video for deletion: ${fetchError.message}`
        );
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(
          `Failed to delete video record: ${deleteError.message}`
        );
      }

      // Delete video file from storage
      if (video?.filename) {
        const { error: storageError } = await supabase.storage
          .from(this.STORAGE_BUCKET)
          .remove([video.filename]);

        if (storageError) {
          console.warn(
            'Failed to delete video file from storage:',
            storageError
          );
        }
      }

      // Delete thumbnail if exists
      if (video?.thumbnail_url) {
        // Extract filename from thumbnail URL if needed
        // This would depend on your thumbnail storage structure
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  /**
   * Get video statistics for dashboard
   */
  static async getVideoStats(): Promise<{
    total: number;
    byCategory: Record<VideoCategory, number>;
    byStatus: Record<VideoUploadStatus, number>;
    totalSize: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('category, upload_status, file_size');

      if (error) {
        throw new Error(`Failed to fetch video stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        byCategory: {} as Record<VideoCategory, number>,
        byStatus: {} as Record<VideoUploadStatus, number>,
        totalSize: 0,
      };

      data.forEach(video => {
        // Count by category
        stats.byCategory[video.category as VideoCategory] =
          (stats.byCategory[video.category as VideoCategory] || 0) + 1;

        // Count by status
        stats.byStatus[video.upload_status as VideoUploadStatus] =
          (stats.byStatus[video.upload_status as VideoUploadStatus] || 0) + 1;

        // Sum file sizes
        stats.totalSize += video.file_size || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching video stats:', error);
      throw error;
    }
  }

  /**
   * Validate video file before upload
   */
  private static validateVideoFile(file: File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `File size too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      );
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
