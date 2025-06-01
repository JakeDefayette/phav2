// Video entity types
export interface Video {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail_url?: string;
  category: VideoCategory;
  visibility: VideoVisibility;
  upload_status: VideoUploadStatus;
  created_at: string;
  file_size?: number;
  file_url?: string;
  filename?: string;
  mime_type?: string;
  tags?: string[];
  created_by?: string;
  practice_id?: string;
  updated_at?: string;
}

export interface VideoSummary {
  total: number;
  published: number;
  draft: number;
  archived: number;
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
  status?: VideoUploadStatus;
  category?: VideoCategory;
  visibility?: VideoVisibility;
  tags?: string[];
  sortBy?: 'created_at' | 'updated_at' | 'title';
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
    videos: Video[];
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
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  onView?: (video: Video) => void;
  className?: string;
}

export interface VideoLibraryProps {
  videos: Video[];
  loading?: boolean;
  error?: string | null;
  onVideoSelect?: (video: Video) => void;
  onVideoEdit?: (video: Video) => void;
  onVideoDelete?: (video: Video) => void;
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
  videos: Video[];
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
