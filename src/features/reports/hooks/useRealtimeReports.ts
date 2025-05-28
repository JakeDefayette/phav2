import { useEffect, useRef, useState, useCallback } from 'react';
import { realtimeReportsService } from '../services/realtimeReports';
import type { GeneratedReport } from '../types';

/**
 * Hook for real-time report updates for a specific assessment
 */
export function useRealtimeReports(
  assessmentId: string | null,
  options: {
    enabled?: boolean;
    debounceMs?: number;
    autoRegenerate?: boolean;
    onError?: (error: Error) => void;
  } = {}
) {
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pendingRegeneration, setPendingRegeneration] = useState(false);

  const subscriptionRef = useRef<string | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  optionsRef.current = options;

  const {
    enabled = true,
    debounceMs = 2000,
    autoRegenerate = true,
    onError,
  } = options;

  // Handle report updates
  const handleReportUpdate = useCallback((updatedReport: GeneratedReport) => {
    setReport(updatedReport);
    setLastUpdate(new Date());
    setIsLoading(false);
    setPendingRegeneration(false);
    setError(null);
  }, []);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    console.error('Real-time report error:', error);
    setError(error);
    setIsLoading(false);
    setPendingRegeneration(false);

    if (optionsRef.current.onError) {
      optionsRef.current.onError(error);
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !assessmentId) {
      return;
    }

    console.log(
      `🔄 Setting up real-time reports for assessment: ${assessmentId}`
    );
    setIsConnected(false);
    setError(null);

    const subscriptionKey = realtimeReportsService.enableRealtimeUpdates(
      assessmentId,
      {
        onReportUpdate: handleReportUpdate,
        onError: handleError,
        debounceMs,
        autoRegenerate,
      }
    );

    subscriptionRef.current = subscriptionKey;
    setIsConnected(true);

    // Check if there's already a pending regeneration
    setPendingRegeneration(
      realtimeReportsService.hasPendingRegeneration(assessmentId)
    );

    return () => {
      if (subscriptionKey) {
        console.log(
          `🔌 Cleaning up real-time reports subscription: ${subscriptionKey}`
        );
        realtimeReportsService.disableRealtimeUpdates(subscriptionKey);
        subscriptionRef.current = null;
        setIsConnected(false);
      }
    };
  }, [
    assessmentId,
    enabled,
    debounceMs,
    autoRegenerate,
    handleReportUpdate,
    handleError,
  ]);

  // Force regeneration function
  const forceRegeneration = useCallback(
    async (reportType: 'standard' | 'detailed' | 'summary' = 'standard') => {
      if (!assessmentId) {
        throw new Error('No assessment ID provided');
      }

      setIsLoading(true);
      setError(null);
      setPendingRegeneration(false);

      try {
        const regeneratedReport =
          await realtimeReportsService.forceRegeneration(
            assessmentId,
            reportType
          );

        setReport(regeneratedReport);
        setLastUpdate(new Date());
        setIsLoading(false);

        return regeneratedReport;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        handleError(err);
        throw err;
      }
    },
    [assessmentId, handleError]
  );

  // Check regeneration status
  const checkPendingRegeneration = useCallback(() => {
    if (assessmentId) {
      const isPending =
        realtimeReportsService.hasPendingRegeneration(assessmentId);
      setPendingRegeneration(isPending);
      return isPending;
    }
    return false;
  }, [assessmentId]);

  return {
    report,
    isLoading,
    error,
    isConnected,
    lastUpdate,
    pendingRegeneration,
    forceRegeneration,
    checkPendingRegeneration,
    subscriptionId: subscriptionRef.current,
  };
}

/**
 * Hook for practice-wide real-time updates
 */
export function usePracticeRealtimeReports(
  practiceId: string | null,
  options: {
    enabled?: boolean;
    onNewAssessment?: (assessmentId: string) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [newAssessments, setNewAssessments] = useState<string[]>([]);
  const [newReports, setNewReports] = useState<GeneratedReport[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionRef = useRef<string | null>(null);
  const optionsRef = useRef(options);

  optionsRef.current = options;

  const { enabled = true, onNewAssessment, onError } = options;

  // Handle new assessments
  const handleNewAssessment = useCallback((assessmentId: string) => {
    setNewAssessments(prev => [...prev, assessmentId]);

    if (optionsRef.current.onNewAssessment) {
      optionsRef.current.onNewAssessment(assessmentId);
    }
  }, []);

  // Handle new reports
  const handleNewReport = useCallback((report: GeneratedReport) => {
    setNewReports(prev => [...prev, report]);
  }, []);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    console.error('Practice real-time error:', error);
    setError(error);

    if (optionsRef.current.onError) {
      optionsRef.current.onError(error);
    }
  }, []);

  // Set up practice-wide subscription
  useEffect(() => {
    if (!enabled || !practiceId) {
      return;
    }

    console.log(`🏢 Setting up practice real-time updates for: ${practiceId}`);
    setIsConnected(false);
    setError(null);

    const subscriptionKey = realtimeReportsService.enablePracticeRealtime(
      practiceId,
      {
        onNewAssessment: handleNewAssessment,
        onReportGenerated: handleNewReport,
        onError: handleError,
      }
    );

    subscriptionRef.current = subscriptionKey;
    setIsConnected(true);

    return () => {
      if (subscriptionKey) {
        console.log(
          `🔌 Cleaning up practice real-time subscription: ${subscriptionKey}`
        );
        realtimeReportsService.disableRealtimeUpdates(subscriptionKey);
        subscriptionRef.current = null;
        setIsConnected(false);
      }
    };
  }, [practiceId, enabled, handleNewAssessment, handleNewReport, handleError]);

  // Clear notifications
  const clearNewAssessments = useCallback(() => {
    setNewAssessments([]);
  }, []);

  const clearNewReports = useCallback(() => {
    setNewReports([]);
  }, []);

  return {
    newAssessments,
    newReports,
    isConnected,
    error,
    clearNewAssessments,
    clearNewReports,
    subscriptionId: subscriptionRef.current,
  };
}

/**
 * Hook for getting real-time reports service status
 */
export function useRealtimeReportsStatus() {
  const [status, setStatus] = useState(() =>
    realtimeReportsService.getStatus()
  );

  useEffect(() => {
    // Poll for status updates
    const interval = setInterval(() => {
      setStatus(realtimeReportsService.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const disableAll = useCallback(() => {
    realtimeReportsService.disableAllRealtimeUpdates();
    setStatus(realtimeReportsService.getStatus());
  }, []);

  return {
    ...status,
    disableAll,
  };
}

/**
 * Hook for debugging real-time reports
 */
export function useRealtimeReportsDebug() {
  const [debugInfo, setDebugInfo] = useState({
    status: realtimeReportsService.getStatus(),
    lastUpdate: new Date().toISOString(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo({
        status: realtimeReportsService.getStatus(),
        lastUpdate: new Date().toISOString(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const forceDisconnectAll = useCallback(() => {
    realtimeReportsService.disableAllRealtimeUpdates();
    setDebugInfo(prev => ({
      ...prev,
      lastUpdate: new Date().toISOString(),
    }));
  }, []);

  const getServiceInstance = useCallback(() => {
    return realtimeReportsService;
  }, []);

  return {
    ...debugInfo,
    forceDisconnectAll,
    getServiceInstance,
  };
}
