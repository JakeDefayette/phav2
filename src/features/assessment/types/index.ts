export interface Assessment {
  id: string;
  child_id: string;
  practice_id?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  brain_o_meter_score?: number;
  started_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AssessmentInsert {
  child_id: string;
  practice_id?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  brain_o_meter_score?: number;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface AssessmentUpdate {
  status?: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  brain_o_meter_score?: number;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface AssessmentWithResponses extends Assessment {
  survey_responses?: Array<{
    id: string;
    question_id: string;
    response_value: any;
    response_text?: string;
    created_at: string;
  }>;
  children?: {
    id: string;
    first_name: string;
    last_name?: string;
    date_of_birth: string;
    parent_id?: string;
  };
}

export interface AssessmentStats {
  total: number;
  completed: number;
  in_progress: number;
  abandoned: number;
  average_score?: number;
  completion_rate: number;
}

// For consistency with the import patterns, also export as CreateAssessmentData and UpdateAssessmentData
export type CreateAssessmentData = AssessmentInsert;
export type UpdateAssessmentData = AssessmentUpdate;
