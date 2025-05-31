export interface AssessmentProgress {
  assessmentId: string;
  stage: AssessmentStage;
  progress: number; // 0-100 percentage
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  startTime: string;
  estimatedTimeRemaining?: number;
  error?: ProgressError;
}

export type AssessmentStage =
  | 'validating'
  | 'saving_responses'
  | 'completing_assessment'
  | 'generating_report'
  | 'finalizing'
  | 'completed'
  | 'error';

export interface ProgressError {
  code: string;
  message: string;
  stage: AssessmentStage;
  timestamp: string;
  recoverable: boolean;
}

export interface ProgressUpdate {
  assessmentId: string;
  update: Partial<AssessmentProgress>;
  timestamp: string;
}

export interface ProgressSubscription {
  assessmentId: string;
  onProgress: (progress: AssessmentProgress) => void;
  onError: (error: ProgressError) => void;
  onComplete: (result: AssessmentCompletionResult) => void;
}

export interface AssessmentCompletionResult {
  assessmentId: string;
  reportId: string;
  status: string;
  brainOMeterScore: number;
  completedAt: string;
  reportGeneratedAt: string;
  responsesCount: number;
}

export interface ReportGenerationProgress {
  stage: ReportGenerationStage;
  progress: number;
  currentOperation: string;
  cacheHit?: boolean;
  performanceMetrics?: {
    duration: number;
    memoryUsage?: number;
  };
}

export type ReportGenerationStage =
  | 'fetching_data'
  | 'mapping_responses'
  | 'generating_charts'
  | 'creating_content'
  | 'caching_results'
  | 'finalizing';
