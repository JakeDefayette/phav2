'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/atoms/Button';
import { Alert } from '@/shared/components/molecules/Alert';
import { RadioGroup } from '@/shared/components/molecules/RadioGroup';
import { Input } from '@/shared/components/atoms/Input';
import { Label } from '@/shared/components/atoms/Label';

interface UnsubscribeFormProps {
  token: string;
  defaultReason?: string;
}

interface UnsubscribeState {
  loading: boolean;
  success: boolean;
  error: string | null;
  email?: string;
  practiceId?: string;
}

const UNSUBSCRIBE_REASONS = [
  { value: 'too_frequent', label: 'I receive too many emails' },
  { value: 'not_relevant', label: 'The content is not relevant to me' },
  { value: 'did_not_subscribe', label: 'I did not subscribe to this list' },
  { value: 'privacy_concerns', label: 'Privacy concerns' },
  { value: 'other', label: 'Other (please specify)' },
];

export function UnsubscribeForm({ token, defaultReason }: UnsubscribeFormProps) {
  const [state, setState] = useState<UnsubscribeState>({
    loading: false,
    success: false,
    error: null,
  });
  const [reason, setReason] = useState(defaultReason || '');
  const [customReason, setCustomReason] = useState('');
  const [isValidating, setIsValidating] = useState(true);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch('/api/email/validate-unsubscribe-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setState(prev => ({
            ...prev,
            error: data.error || 'Invalid unsubscribe link',
          }));
        } else {
          setState(prev => ({
            ...prev,
            email: data.email,
            practiceId: data.practiceId,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to validate unsubscribe link',
        }));
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const finalReason = reason === 'other' ? customReason : 
        UNSUBSCRIBE_REASONS.find(r => r.value === reason)?.label || reason;

      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          reason: finalReason,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unsubscribe');
      }

      setState(prev => ({
        ...prev,
        success: true,
        loading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
        loading: false,
      }));
    }
  };

  if (isValidating) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Validating unsubscribe request...</p>
      </div>
    );
  }

  if (state.error && !state.email) {
    return (
      <Alert variant="error">
        <div>
          <h3 className="font-medium">Invalid Unsubscribe Link</h3>
          <p className="mt-1 text-sm">{state.error}</p>
          <p className="mt-2 text-sm">
            This link may have expired or been used already. Please contact 
            support if you continue to receive unwanted emails.
          </p>
        </div>
      </Alert>
    );
  }

  if (state.success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Successfully Unsubscribed
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          You have been removed from our email list. You will no longer receive 
          marketing emails from us.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Note: You may still receive transactional emails related to your account 
          or services you use.
        </p>
        <div className="mt-4">
          <a
            href="/preferences"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Manage other email preferences
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleUnsubscribe} className="space-y-6">
      {state.email && (
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Email:</span> {state.email}
          </p>
        </div>
      )}

      {state.error && (
        <Alert variant="error">
          {state.error}
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="reason" className="text-base font-medium text-gray-900">
            Help us improve: Why are you unsubscribing? (Optional)
          </Label>
          <div className="mt-2">
            <RadioGroup
              name="reason"
              value={reason}
              onChange={setReason}
              options={UNSUBSCRIBE_REASONS}
            />
          </div>
        </div>

        {reason === 'other' && (
          <div>
            <Label htmlFor="customReason" className="text-sm font-medium text-gray-700">
              Please specify:
            </Label>
            <Input
              id="customReason"
              name="customReason"
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Tell us more about your reason..."
              className="mt-1"
              required={reason === 'other'}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full"
          variant="primary"
          isLoading={state.loading}
          disabled={state.loading || (reason === 'other' && !customReason.trim())}
        >
          {state.loading ? 'Processing...' : 'Unsubscribe'}
        </Button>

        <Button
          type="button"
          className="w-full"
          variant="secondary"
          onClick={() => window.history.back()}
          disabled={state.loading}
        >
          Cancel
        </Button>
      </div>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>
          By clicking "Unsubscribe", you confirm that you want to stop receiving 
          marketing emails from us.
        </p>
        <p>
          This action cannot be undone through this form. You can resubscribe 
          by visiting our website.
        </p>
      </div>
    </form>
  );
} 