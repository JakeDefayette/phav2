'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';
import { EmailService } from '@/shared/services/email';
import { ScheduledEmailRecord } from '@/features/dashboard/services/emailScheduler';
import { formatDistanceToNow } from 'date-fns';

interface ScheduledEmailsWidgetProps {
  practiceId: string;
  className?: string;
}

export function ScheduledEmailsWidget({ 
  practiceId, 
  className = '' 
}: ScheduledEmailsWidgetProps) {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  
  const emailService = new EmailService();

  useEffect(() => {
    loadScheduledEmails();
  }, [practiceId, selectedStatus]);

  const loadScheduledEmails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await emailService.getScheduledEmails(practiceId, {
        status: selectedStatus,
        limit: 10
      });

      if (result.error) {
        setError(result.error);
      } else {
        setScheduledEmails(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled emails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEmail = async (scheduledEmailId: string) => {
    try {
      const result = await emailService.cancelScheduledEmail(scheduledEmailId, practiceId);
      
      if (result.success) {
        // Refresh the list
        await loadScheduledEmails();
      } else {
        setError(result.error || 'Failed to cancel email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel email');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatScheduledTime = (scheduledAt: Date) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    
    if (scheduled > now) {
      return `in ${formatDistanceToNow(scheduled)}`;
    } else {
      return `${formatDistanceToNow(scheduled)} ago`;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Scheduled Emails
        </h3>
        <Button
          onClick={loadScheduledEmails}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2 mb-4">
        {['pending', 'processing', 'sent', 'failed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedStatus === status
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loading size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={loadScheduledEmails} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      ) : scheduledEmails.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No scheduled emails found for status: {selectedStatus}
        </div>
      ) : (
        <div className="space-y-3">
          {scheduledEmails.map((email) => (
            <div
              key={email.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {email.subject}
                  </h4>
                  <p className="text-sm text-gray-600">
                    To: {email.recipientEmail}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(email.status)}`}>
                    {email.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(email.priority)}`}>
                    {email.priority}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>
                    Type: {email.templateType.replace('_', ' ')}
                  </span>
                  <span>
                    Scheduled: {formatScheduledTime(email.scheduledAt)}
                  </span>
                  {email.isRecurring && (
                    <span className="text-blue-600">
                      🔄 Recurring
                    </span>
                  )}
                </div>

                {email.status === 'pending' && (
                  <Button
                    onClick={() => handleCancelEmail(email.id)}
                    variant="outline"
                    size="xs"
                    className="text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Additional Info */}
              {email.retryCount > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Retry count: {email.retryCount}/{email.maxRetries}
                </div>
              )}
              
              {email.errorMessage && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  Error: {email.errorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
} 