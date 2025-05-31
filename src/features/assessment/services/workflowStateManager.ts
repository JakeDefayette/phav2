import { SurveyFormData } from '../components/MultiStepSurveyForm/types';
import { AssessmentProgress } from '../types/progress';
import { createError } from '@/shared/types/errors';
import { supabase } from '@/shared/services/supabase';
import { validateSession } from '@/shared/services/session';

/**
 * Workflow state management for assessment flow
 */
export interface WorkflowState {
  sessionId: string;
  assessmentId?: string;
  currentStep: number;
  formData: Partial<SurveyFormData>;
  progress: AssessmentProgress | null;
  isAnonymous: boolean;
  startedAt: string;
  lastUpdatedAt: string;
  savedCount: number;
  errors: WorkflowError[];
  resumable: boolean;
}

export interface WorkflowError {
  code: string;
  message: string;
  stage: string;
  timestamp: string;
  recoverable: boolean;
  retryAttempts: number;
}

export interface WorkflowRecoveryOptions {
  clearErrors?: boolean;
  resetStep?: boolean;
  preserveFormData?: boolean;
}

export interface WorkflowMetrics {
  averageCompletionTime: number;
  stepDropoffRates: Record<number, number>;
  errorRecoveryRate: number;
  anonymousCompletionRate: number;
}

/**
 * Central workflow state manager for survey assessment flow
 */
export class WorkflowStateManager {
  private static instance: WorkflowStateManager;
  private readonly storageKey = 'workflow_state';
  private readonly encryptionKey = 'pha_workflow_v1';
  private state: WorkflowState | null = null;
  private saveTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(state: WorkflowState) => void> = [];

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WorkflowStateManager {
    if (!WorkflowStateManager.instance) {
      WorkflowStateManager.instance = new WorkflowStateManager();
    }
    return WorkflowStateManager.instance;
  }

  /**
   * Initialize workflow state from storage
   */
  private async initialize(): Promise<void> {
    try {
      const stored = this.getStoredState();
      if (stored) {
        // Validate if state is still valid
        const isValid = await this.validateStoredState(stored);
        if (isValid) {
          this.state = stored;
          this.notifyListeners();
        } else {
          await this.clearStoredState();
        }
      }
    } catch (error) {
      console.warn('Failed to initialize workflow state:', error);
      await this.clearStoredState();
    }
  }

  /**
   * Start a new workflow session
   */
  async startSession(isAnonymous: boolean = true): Promise<WorkflowState> {
    const sessionId = this.generateSessionId();

    const newState: WorkflowState = {
      sessionId,
      currentStep: 1,
      formData: {},
      progress: null,
      isAnonymous,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      savedCount: 0,
      errors: [],
      resumable: true,
    };

    this.state = newState;
    await this.persistState();
    this.notifyListeners();

    console.log(
      `📋 Started new workflow session: ${sessionId} (anonymous: ${isAnonymous})`
    );
    return newState;
  }

  /**
   * Resume existing workflow session
   */
  async resumeSession(): Promise<WorkflowState | null> {
    if (!this.state) {
      const stored = this.getStoredState();
      if (stored && stored.resumable) {
        const isValid = await this.validateStoredState(stored);
        if (isValid) {
          this.state = stored;
          this.notifyListeners();
          console.log(`🔄 Resumed workflow session: ${stored.sessionId}`);
          return this.state;
        }
      }
    }
    return this.state;
  }

  /**
   * Update form data with automatic persistence
   */
  async updateFormData(
    step: number,
    data: Partial<SurveyFormData>,
    options: { immediate?: boolean } = {}
  ): Promise<void> {
    if (!this.state) {
      throw createError('No active workflow session', 'NO_ACTIVE_SESSION');
    }

    // Merge form data
    this.state.formData = { ...this.state.formData, ...data };
    this.state.currentStep = Math.max(this.state.currentStep, step);
    this.state.lastUpdatedAt = new Date().toISOString();
    this.state.savedCount++;

    // Persist immediately or with debounce
    if (options.immediate) {
      await this.persistState();
    } else {
      this.debouncePersist();
    }

    this.notifyListeners();
  }

  /**
   * Update workflow progress
   */
  async updateProgress(progress: AssessmentProgress): Promise<void> {
    if (!this.state) return;

    this.state.progress = progress;
    this.state.lastUpdatedAt = new Date().toISOString();

    // If assessment ID is set, update it
    if (progress.assessmentId && !this.state.assessmentId) {
      this.state.assessmentId = progress.assessmentId;
    }

    await this.persistState();
    this.notifyListeners();
  }

  /**
   * Report workflow error
   */
  async reportError(error: {
    code: string;
    message: string;
    stage: string;
    recoverable?: boolean;
  }): Promise<void> {
    if (!this.state) return;

    const workflowError: WorkflowError = {
      code: error.code,
      message: error.message,
      stage: error.stage,
      timestamp: new Date().toISOString(),
      recoverable: error.recoverable ?? true,
      retryAttempts: 0,
    };

    // Check if error already exists
    const existingErrorIndex = this.state.errors.findIndex(
      e => e.code === error.code && e.stage === error.stage
    );

    if (existingErrorIndex >= 0) {
      // Update existing error
      this.state.errors[existingErrorIndex] = {
        ...workflowError,
        retryAttempts: this.state.errors[existingErrorIndex].retryAttempts + 1,
      };
    } else {
      // Add new error
      this.state.errors.push(workflowError);
    }

    // Limit error history
    if (this.state.errors.length > 10) {
      this.state.errors = this.state.errors.slice(-10);
    }

    this.state.lastUpdatedAt = new Date().toISOString();
    await this.persistState();
    this.notifyListeners();
  }

  /**
   * Recover from errors
   */
  async recoverFromErrors(
    options: WorkflowRecoveryOptions = {}
  ): Promise<boolean> {
    if (!this.state) return false;

    const recoverableErrors = this.state.errors.filter(e => e.recoverable);

    if (recoverableErrors.length === 0) {
      return true; // No recoverable errors
    }

    try {
      if (options.clearErrors) {
        this.state.errors = this.state.errors.filter(e => !e.recoverable);
      }

      if (options.resetStep && this.state.currentStep > 1) {
        this.state.currentStep = Math.max(1, this.state.currentStep - 1);
      }

      if (!options.preserveFormData) {
        // Keep essential data but clear potentially corrupted fields
        const essentialFields = [
          'parentFirstName',
          'parentLastName',
          'childFirstName',
          'childLastName',
          'email',
        ];
        const preservedData: Partial<SurveyFormData> = {};
        essentialFields.forEach(field => {
          if (this.state!.formData[field as keyof SurveyFormData]) {
            preservedData[field as keyof SurveyFormData] =
              this.state!.formData[field as keyof SurveyFormData];
          }
        });
        this.state.formData = preservedData;
      }

      this.state.lastUpdatedAt = new Date().toISOString();
      await this.persistState();
      this.notifyListeners();

      console.log(`🔧 Recovered from ${recoverableErrors.length} errors`);
      return true;
    } catch (error) {
      console.error('Failed to recover from errors:', error);
      return false;
    }
  }

  /**
   * Convert anonymous session to authenticated
   */
  async convertToAuthenticated(): Promise<boolean> {
    if (!this.state || !this.state.isAnonymous) {
      return false;
    }

    try {
      // Validate current authentication
      const validation = await validateSession();
      if (!validation.isValid) {
        return false;
      }

      this.state.isAnonymous = false;
      this.state.lastUpdatedAt = new Date().toISOString();
      await this.persistState();
      this.notifyListeners();

      console.log(
        `🔐 Converted session to authenticated: ${this.state.sessionId}`
      );
      return true;
    } catch (error) {
      console.error('Failed to convert to authenticated session:', error);
      return false;
    }
  }

  /**
   * Complete workflow and cleanup
   */
  async completeWorkflow(): Promise<void> {
    if (!this.state) return;

    this.state.resumable = false;
    this.state.lastUpdatedAt = new Date().toISOString();
    await this.persistState();

    // Schedule cleanup after delay (allow for final UI updates)
    setTimeout(() => {
      this.clearStoredState();
      this.state = null;
      this.notifyListeners();
    }, 30000); // 30 seconds delay

    console.log(`✅ Completed workflow session: ${this.state.sessionId}`);
  }

  /**
   * Get current workflow state
   */
  getCurrentState(): WorkflowState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Check if workflow can be resumed
   */
  canResume(): boolean {
    const stored = this.getStoredState();
    return !!(
      stored &&
      stored.resumable &&
      stored.formData &&
      Object.keys(stored.formData).length > 0
    );
  }

  /**
   * Get workflow metrics
   */
  getMetrics(): WorkflowMetrics {
    // This would integrate with analytics service in production
    return {
      averageCompletionTime: 0,
      stepDropoffRates: {},
      errorRecoveryRate: 0,
      anonymousCompletionRate: 0,
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: WorkflowState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear workflow state
   */
  async clearState(): Promise<void> {
    this.state = null;
    await this.clearStoredState();
    this.notifyListeners();
  }

  // Private methods

  private generateSessionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getStoredState(): WorkflowState | null {
    if (typeof window === 'undefined') return null;

    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Failed to retrieve stored workflow state:', error);
      return null;
    }
  }

  private async persistState(): Promise<void> {
    if (typeof window === 'undefined' || !this.state) return;

    try {
      const serialized = JSON.stringify(this.state);
      const encrypted = this.encrypt(serialized);
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error('Failed to persist workflow state:', error);
    }
  }

  private async clearStoredState(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
  }

  private debouncePersist(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.persistState();
    }, 1000); // 1 second debounce
  }

  private async validateStoredState(state: WorkflowState): Promise<boolean> {
    // Check if state is too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    const age = Date.now() - new Date(state.lastUpdatedAt).getTime();
    if (age > maxAge) {
      return false;
    }

    // Validate session structure
    if (
      !state.sessionId ||
      !state.startedAt ||
      typeof state.currentStep !== 'number'
    ) {
      return false;
    }

    // If authenticated session, validate current auth state
    if (!state.isAnonymous) {
      const validation = await validateSession();
      if (!validation.isValid) {
        return false;
      }
    }

    return true;
  }

  private notifyListeners(): void {
    if (this.state) {
      this.listeners.forEach(listener => {
        try {
          listener({ ...this.state! });
        } catch (error) {
          console.error('Error in workflow state listener:', error);
        }
      });
    }
  }

  // Simple encryption for localStorage (not cryptographically secure)
  private encrypt(text: string): string {
    const encoded = btoa(encodeURIComponent(text));
    return btoa(this.encryptionKey + encoded);
  }

  private decrypt(encrypted: string): string {
    const decoded = atob(encrypted);
    const withoutKey = decoded.substring(this.encryptionKey.length);
    return decodeURIComponent(atob(withoutKey));
  }
}

// Export singleton instance
export const workflowStateManager = WorkflowStateManager.getInstance();
