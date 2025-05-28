import { useEffect, useRef, useCallback, useState } from 'react';
import {
  realtimeManager,
  realtimeUtils,
  type SurveyResponseCallback,
  type AssessmentCallback,
  type ReportCallback,
  type RealtimeEventType,
} from '@/shared/services/supabase-realtime';

// Hook for subscribing to survey response changes
export function useSurveyResponseSubscription(
  assessmentId: string | null,
  callback: SurveyResponseCallback,
  options: {
    event?: RealtimeEventType | '*';
    enabled?: boolean;
  } = {}
) {
  const callbackRef = useRef(callback);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  const { event = '*', enabled = true } = options;

  useEffect(() => {
    if (!enabled || !assessmentId) {
      return;
    }

    // Create subscription
    const channelId = realtimeManager.subscribeSurveyResponses(
      payload => callbackRef.current(payload),
      { assessmentId, event }
    );

    setSubscriptionId(channelId);
    setIsConnected(true);

    // Cleanup function
    return () => {
      if (channelId) {
        realtimeManager.unsubscribe(channelId);
        setSubscriptionId(null);
        setIsConnected(false);
      }
    };
  }, [assessmentId, event, enabled]);

  // Manual unsubscribe function
  const unsubscribe = useCallback(() => {
    if (subscriptionId) {
      realtimeManager.unsubscribe(subscriptionId);
      setSubscriptionId(null);
      setIsConnected(false);
    }
  }, [subscriptionId]);

  return {
    subscriptionId,
    isConnected,
    unsubscribe,
  };
}

// Hook for subscribing to assessment changes
export function useAssessmentSubscription(
  callback: AssessmentCallback,
  options: {
    practiceId?: string;
    childId?: string;
    event?: RealtimeEventType | '*';
    enabled?: boolean;
  } = {}
) {
  const callbackRef = useRef(callback);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  callbackRef.current = callback;

  const { practiceId, childId, event = '*', enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Create subscription
    const channelId = realtimeManager.subscribeAssessments(
      payload => callbackRef.current(payload),
      { practiceId, childId, event }
    );

    setSubscriptionId(channelId);
    setIsConnected(true);

    return () => {
      if (channelId) {
        realtimeManager.unsubscribe(channelId);
        setSubscriptionId(null);
        setIsConnected(false);
      }
    };
  }, [practiceId, childId, event, enabled]);

  const unsubscribe = useCallback(() => {
    if (subscriptionId) {
      realtimeManager.unsubscribe(subscriptionId);
      setSubscriptionId(null);
      setIsConnected(false);
    }
  }, [subscriptionId]);

  return {
    subscriptionId,
    isConnected,
    unsubscribe,
  };
}

// Hook for subscribing to report changes
export function useReportSubscription(
  callback: ReportCallback,
  options: {
    assessmentId?: string;
    practiceId?: string;
    event?: RealtimeEventType | '*';
    enabled?: boolean;
  } = {}
) {
  const callbackRef = useRef(callback);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  callbackRef.current = callback;

  const { assessmentId, practiceId, event = '*', enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channelId = realtimeManager.subscribeReports(
      payload => callbackRef.current(payload),
      { assessmentId, practiceId, event }
    );

    setSubscriptionId(channelId);
    setIsConnected(true);

    return () => {
      if (channelId) {
        realtimeManager.unsubscribe(channelId);
        setSubscriptionId(null);
        setIsConnected(false);
      }
    };
  }, [assessmentId, practiceId, event, enabled]);

  const unsubscribe = useCallback(() => {
    if (subscriptionId) {
      realtimeManager.unsubscribe(subscriptionId);
      setSubscriptionId(null);
      setIsConnected(false);
    }
  }, [subscriptionId]);

  return {
    subscriptionId,
    isConnected,
    unsubscribe,
  };
}

// Comprehensive hook for assessment-specific subscriptions
export function useAssessmentRealtime(
  assessmentId: string | null,
  callbacks: {
    onSurveyResponse?: SurveyResponseCallback;
    onAssessmentUpdate?: AssessmentCallback;
    onReportUpdate?: ReportCallback;
  },
  options: {
    enabled?: boolean;
  } = {}
) {
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);

  callbacksRef.current = callbacks;

  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !assessmentId) {
      return;
    }

    // Create all subscriptions at once
    const channelIds = realtimeUtils.subscribeToAssessment(assessmentId, {
      onSurveyResponse: callbacksRef.current.onSurveyResponse,
      onAssessmentUpdate: callbacksRef.current.onAssessmentUpdate,
      onReportUpdate: callbacksRef.current.onReportUpdate,
    });

    setSubscriptionIds(channelIds);
    setIsConnected(channelIds.length > 0);

    return () => {
      realtimeUtils.cleanup(channelIds);
      setSubscriptionIds([]);
      setIsConnected(false);
    };
  }, [assessmentId, enabled]);

  const unsubscribeAll = useCallback(() => {
    realtimeUtils.cleanup(subscriptionIds);
    setSubscriptionIds([]);
    setIsConnected(false);
  }, [subscriptionIds]);

  return {
    subscriptionIds,
    isConnected,
    activeSubscriptions: subscriptionIds.length,
    unsubscribeAll,
  };
}

// Hook for practice-wide subscriptions
export function usePracticeRealtime(
  practiceId: string | null,
  callbacks: {
    onNewAssessment?: AssessmentCallback;
    onReportGenerated?: ReportCallback;
  },
  options: {
    enabled?: boolean;
  } = {}
) {
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);

  callbacksRef.current = callbacks;

  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !practiceId) {
      return;
    }

    const channelIds = realtimeUtils.subscribeToPractice(practiceId, {
      onNewAssessment: callbacksRef.current.onNewAssessment,
      onReportGenerated: callbacksRef.current.onReportGenerated,
    });

    setSubscriptionIds(channelIds);
    setIsConnected(channelIds.length > 0);

    return () => {
      realtimeUtils.cleanup(channelIds);
      setSubscriptionIds([]);
      setIsConnected(false);
    };
  }, [practiceId, enabled]);

  const unsubscribeAll = useCallback(() => {
    realtimeUtils.cleanup(subscriptionIds);
    setSubscriptionIds([]);
    setIsConnected(false);
  }, [subscriptionIds]);

  return {
    subscriptionIds,
    isConnected,
    activeSubscriptions: subscriptionIds.length,
    unsubscribeAll,
  };
}

// Hook for getting real-time connection status
export function useRealtimeStatus() {
  const [status, setStatus] = useState(() => realtimeManager.getStatus());

  useEffect(() => {
    // Poll for status updates
    const interval = setInterval(() => {
      setStatus(realtimeManager.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

// Hook for debugging real-time subscriptions
export function useRealtimeDebug() {
  const [debugInfo, setDebugInfo] = useState({
    status: realtimeManager.getStatus(),
    lastUpdate: new Date().toISOString(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo({
        status: realtimeManager.getStatus(),
        lastUpdate: new Date().toISOString(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const forceReconnect = useCallback(() => {
    // Force reconnection by unsubscribing all and letting components re-subscribe
    realtimeManager.unsubscribeAll();
    setDebugInfo(prev => ({
      ...prev,
      lastUpdate: new Date().toISOString(),
    }));
  }, []);

  return {
    ...debugInfo,
    forceReconnect,
  };
}
