'use client';

import React, { useEffect, useState } from 'react';
import { workflowStateManager } from '@/features/assessment/services/workflowStateManager';
import { Button } from '@/shared/components/atoms/Button';

export default function SimpleWorkflowTest() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    addLog('Component mounted, checking for existing workflow state...');

    // Check if we can resume a session
    const canResume = workflowStateManager.canResume();
    addLog(`Can resume session: ${canResume}`);

    // Get current state
    const currentState = workflowStateManager.getCurrentState();
    setSessionInfo(currentState);

    if (currentState) {
      addLog(`Found existing session: ${currentState.sessionId}`);
    } else {
      addLog('No existing session found');
    }
  }, []);

  const testStartSession = async () => {
    setIsLoading(true);
    addLog('Starting new workflow session...');

    try {
      const newState = await workflowStateManager.startSession(true);
      setSessionInfo(newState);
      addLog(`✅ Session started: ${newState.sessionId}`);
    } catch (error) {
      addLog(`❌ Error starting session: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSaveFormData = async () => {
    if (!sessionInfo) {
      addLog('❌ No active session - start a session first');
      return;
    }

    setIsLoading(true);
    addLog('Saving form data...');

    try {
      await workflowStateManager.updateFormData(1, {
        lifestyleStressors: ['Poor sleep', 'High stress'],
        parentFirstName: 'Test Parent',
        childFirstName: 'Test Child',
      });

      const updatedState = workflowStateManager.getCurrentState();
      setSessionInfo(updatedState);
      addLog('✅ Form data saved successfully');
    } catch (error) {
      addLog(`❌ Error saving form data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testErrorReporting = async () => {
    if (!sessionInfo) {
      addLog('❌ No active session - start a session first');
      return;
    }

    setIsLoading(true);
    addLog('Reporting test error...');

    try {
      await workflowStateManager.reportError({
        code: 'TEST_ERROR',
        message: 'This is a test error for demonstration',
        stage: 'testing',
        recoverable: true,
      });

      const updatedState = workflowStateManager.getCurrentState();
      setSessionInfo(updatedState);
      addLog('✅ Error reported successfully');
    } catch (error) {
      addLog(`❌ Error reporting test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRecovery = async () => {
    if (!sessionInfo) {
      addLog('❌ No active session - start a session first');
      return;
    }

    setIsLoading(true);
    addLog('Testing error recovery...');

    try {
      const recovered = await workflowStateManager.recoverFromErrors({
        clearErrors: true,
        preserveFormData: true,
      });

      const updatedState = workflowStateManager.getCurrentState();
      setSessionInfo(updatedState);
      addLog(`✅ Recovery ${recovered ? 'successful' : 'failed'}`);
    } catch (error) {
      addLog(`❌ Error during recovery: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testClearState = async () => {
    setIsLoading(true);
    addLog('Clearing workflow state...');

    try {
      await workflowStateManager.clearState();
      setSessionInfo(null);
      addLog('✅ State cleared successfully');
    } catch (error) {
      addLog(`❌ Error clearing state: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>
          🧪 Workflow State Manager Test
        </h1>

        {/* Action Buttons */}
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-8'>
          <Button
            onClick={testStartSession}
            disabled={isLoading}
            variant='primary'
          >
            Start Session
          </Button>
          <Button
            onClick={testSaveFormData}
            disabled={isLoading || !sessionInfo}
            variant='secondary'
          >
            Save Form Data
          </Button>
          <Button
            onClick={testErrorReporting}
            disabled={isLoading || !sessionInfo}
            variant='secondary'
          >
            Report Error
          </Button>
          <Button
            onClick={testRecovery}
            disabled={isLoading || !sessionInfo}
            variant='secondary'
          >
            Test Recovery
          </Button>
          <Button
            onClick={testClearState}
            disabled={isLoading}
            variant='outline'
          >
            Clear State
          </Button>
          <Button onClick={clearLogs} variant='ghost'>
            Clear Logs
          </Button>
        </div>

        {/* Session Info */}
        <div className='bg-white rounded-lg p-6 mb-8 shadow'>
          <h2 className='text-xl font-semibold mb-4'>Session Information</h2>
          {sessionInfo ? (
            <div className='space-y-2 text-sm'>
              <p>
                <strong>Session ID:</strong> {sessionInfo.sessionId}
              </p>
              <p>
                <strong>Current Step:</strong> {sessionInfo.currentStep}
              </p>
              <p>
                <strong>Is Anonymous:</strong>{' '}
                {sessionInfo.isAnonymous ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Started:</strong>{' '}
                {new Date(sessionInfo.startedAt).toLocaleString()}
              </p>
              <p>
                <strong>Last Updated:</strong>{' '}
                {new Date(sessionInfo.lastUpdatedAt).toLocaleString()}
              </p>
              <p>
                <strong>Save Count:</strong> {sessionInfo.savedCount}
              </p>
              <p>
                <strong>Errors:</strong> {sessionInfo.errors.length}
              </p>
              <p>
                <strong>Form Data Keys:</strong>{' '}
                {Object.keys(sessionInfo.formData).join(', ') || 'None'}
              </p>
              {sessionInfo.formData &&
                Object.keys(sessionInfo.formData).length > 0 && (
                  <details className='mt-4'>
                    <summary className='cursor-pointer font-medium'>
                      Form Data (click to expand)
                    </summary>
                    <pre className='mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto'>
                      {JSON.stringify(sessionInfo.formData, null, 2)}
                    </pre>
                  </details>
                )}
              {sessionInfo.errors.length > 0 && (
                <details className='mt-4'>
                  <summary className='cursor-pointer font-medium text-red-600'>
                    Errors (click to expand)
                  </summary>
                  <div className='mt-2 space-y-2'>
                    {sessionInfo.errors.map((error: any, index: number) => (
                      <div
                        key={index}
                        className='p-2 bg-red-50 rounded text-xs'
                      >
                        <div>
                          <strong>Code:</strong> {error.code}
                        </div>
                        <div>
                          <strong>Message:</strong> {error.message}
                        </div>
                        <div>
                          <strong>Stage:</strong> {error.stage}
                        </div>
                        <div>
                          <strong>Recoverable:</strong>{' '}
                          {error.recoverable ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Retry Attempts:</strong> {error.retryAttempts}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ) : (
            <p className='text-gray-500'>No active session</p>
          )}
        </div>

        {/* Logs */}
        <div className='bg-white rounded-lg p-6 shadow'>
          <h2 className='text-xl font-semibold mb-4'>Test Logs</h2>
          <div className='h-64 overflow-y-auto border border-gray-200 rounded p-4 bg-gray-50'>
            {logs.length === 0 ? (
              <p className='text-gray-500'>No logs yet...</p>
            ) : (
              <div className='space-y-1 text-sm font-mono'>
                {logs.map((log, index) => (
                  <div key={index} className='text-gray-700'>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className='mt-8 bg-blue-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-blue-900 mb-3'>
            Test Instructions
          </h3>
          <ol className='list-decimal list-inside space-y-2 text-blue-800'>
            <li>Click "Start Session" to create a new workflow session</li>
            <li>Click "Save Form Data" to test form data persistence</li>
            <li>Click "Report Error" to simulate error tracking</li>
            <li>Click "Test Recovery" to test error recovery mechanisms</li>
            <li>Refresh the page and observe session persistence</li>
            <li>
              Check browser localStorage (workflow_state key) to see encrypted
              data
            </li>
            <li>Click "Clear State" when done testing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
