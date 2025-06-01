// Video entity types
export interface Video {
  id: string;
  title: string;
  description?: string;
  filename: string;
  file_url: string;
  file_size: number;
  duration?: number; // in seconds
  thumbnail_url?: string;
  mime_type: string;
  tags?: string[];
  category?: VideoCategory;
  visibility: VideoVisibility;
  upload_status: VideoUploadStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  practice_id: string;
}

export interface VideoSummary {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration?: number;
  category?: VideoCategory;
  visibility: VideoVisibility;
  upload_status: VideoUploadStatus;
  created_at: string;
  file_size: number;
}

// Form data types
export interface VideoFormData {
  title: string;
  description: string;
  file?: File;
  tags: string[];
  category: VideoCategory;
  visibility: VideoVisibility;
}

// Enum types
export type VideoCategory =
  | 'educational'
  | 'promotional'
  | 'patient_instructions'
  | 'exercise_demonstrations'
  | 'office_tour'
  | 'testimonials'
  | 'other';

export type VideoVisibility = 'private' | 'practice' | 'public';

export type VideoUploadStatus = 'uploading' | 'processing' | 'ready' | 'failed';

// Search and filter types
export interface VideoSearchFilters {
  search?: string;
  category?: VideoCategory;
  visibility?: VideoVisibility;
  status?: VideoUploadStatus;
  tags?: string[];
  sortBy?: VideoSortOption;
  sortOrder?: 'asc' | 'desc';
}

export type VideoSortOption = 'created_at' | 'title' | 'duration' | 'file_size';

// API types
export namespace VideosAPI {
  export interface ListRequest {
    page?: number;
    limit?: number;
    filters?: VideoSearchFilters;
  }

  export interface ListResponse {
    videos: VideoSummary[];
    total: number;
    page: number;
    totalPages: number;
  }

  export interface GetRequest {
    id: string;
  }

  export interface GetResponse {
    video: Video;
  }

  export interface CreateRequest {
    video: Omit<VideoFormData, 'file'>;
    file: File;
  }

  export interface CreateResponse {
    video: Video;
    uploadUrl?: string;
  }

  export interface UpdateRequest {
    id: string;
    updates: Partial<Omit<VideoFormData, 'file'>>;
  }

  export interface UpdateResponse {
    video: Video;
  }

  export interface DeleteRequest {
    id: string;
  }

  export interface DeleteResponse {
    success: boolean;
  }

  export interface UploadProgressEvent {
    loaded: number;
    total: number;
    percentage: number;
  }
}

// Component prop types
export interface VideoCardProps {
  video: VideoSummary;
  onEdit?: (video: VideoSummary) => void;
  onDelete?: (video: VideoSummary) => void;
  onView?: (video: VideoSummary) => void;
  className?: string;
}

export interface VideoLibraryProps {
  videos: VideoSummary[];
  loading?: boolean;
  error?: string | null;
  onVideoSelect?: (video: VideoSummary) => void;
  onVideoEdit?: (video: VideoSummary) => void;
  onVideoDelete?: (video: VideoSummary) => void;
  className?: string;
}

export interface VideoUploaderProps {
  onUpload: (formData: VideoFormData & { file: File }) => void;
  onCancel?: () => void;
  loading?: boolean;
  progress?: number;
  error?: string | null;
  className?: string;
}

export interface VideoPlayerProps {
  video: Video;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export interface VideoDetailProps {
  video: Video;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  className?: string;
}

export interface VideoSearchProps {
  filters: VideoSearchFilters;
  onFiltersChange: (filters: VideoSearchFilters) => void;
  loading?: boolean;
  className?: string;
}

// Hook return types
export interface UseVideosReturn {
  videos: VideoSummary[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  filters: VideoSearchFilters;
  setFilters: (filters: VideoSearchFilters) => void;
  nextPage: () => void;
  previousPage: () => void;
  refresh: () => void;
}

export interface UseVideoReturn {
  video: Video | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface UseVideoMutationsReturn {
  uploadVideo: (data: VideoFormData & { file: File }) => Promise<Video>;
  updateVideo: (id: string, updates: Partial<VideoFormData>) => Promise<Video>;
  deleteVideo: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}
