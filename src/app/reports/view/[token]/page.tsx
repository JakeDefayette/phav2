'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface ReportData {
  id: string;
  assessmentId: string;
  practiceId?: string;
  content: {
    child: {
      name: string;
      age: number;
      gender?: string;
    };
    assessment: {
      id: string;
      brain_o_meter_score: number;
      completed_at: string;
      status: string;
    };
    recommendations?: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    summary?: {
      overview: string;
      key_findings: string[];
    };
  };
  generatedAt: string;
  createdAt: string;
}

interface ReportViewPageProps {}

export default function ReportViewPage({}: ReportViewPageProps) {
  const params = useParams();
  const token = params?.token as string;
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      console.log(
        '🔍 Fetching report data for token:',
        token?.substring(0, 8) + '...'
      );

      const response = await fetch(`/api/reports/view/${token}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to load report: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      console.log('✅ Report data loaded:', result);

      if (result.success && result.data) {
        setReportData(result.data);
      } else {
        throw new Error('Invalid report data received');
      }
    } catch (err) {
      console.error('❌ Error fetching report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Invalid report link');
      setLoading(false);
      return;
    }

    fetchReportData();
  }, [token, fetchReportData]);

  const handleDownloadPDF = () => {
    console.log('📥 Starting PDF download...');
    window.open(`/reports/download/${token}`, '_blank');
  };

  const handleShareReport = () => {
    const currentUrl = window.location.href;
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        alert('Report link copied to clipboard!');
      })
      .catch(() => {
        alert(`Share this link: ${currentUrl}`);
      });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading your health report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center'>
          <div className='text-red-500 text-6xl mb-4'>⚠️</div>
          <h2 className='text-xl font-semibold mb-4'>Unable to Load Report</h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600'>No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm'>
        <div className='max-w-4xl mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Health Assessment Report
              </h1>
              <p className='text-gray-600'>
                For {reportData.content.child.name}
              </p>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={handleShareReport}
                className='hidden sm:block px-4 py-2 border border-gray-300 rounded hover:bg-gray-50'
              >
                Share Report
              </button>
              <button
                onClick={handleDownloadPDF}
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='space-y-8'>
          {/* Child Information Card */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold mb-4'>Child Information</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Name
                </label>
                <p className='text-lg font-semibold'>
                  {reportData.content.child.name}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-500'>
                  Age
                </label>
                <p className='text-lg font-semibold'>
                  {reportData.content.child.age} years old
                </p>
              </div>
              {reportData.content.child.gender && (
                <div>
                  <label className='block text-sm font-medium text-gray-500'>
                    Gender
                  </label>
                  <p className='text-lg font-semibold capitalize'>
                    {reportData.content.child.gender}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Brain-O-Meter Score */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold mb-4'>
              Brain-O-Meter™ Score
            </h2>
            <div className='flex items-center justify-center'>
              <div className='text-center'>
                <div className='text-6xl font-bold text-blue-600 mb-2'>
                  {reportData.content.assessment.brain_o_meter_score}
                </div>
                <div className='text-gray-500'>out of 100</div>
                <div className='mt-4 max-w-md text-gray-600'>
                  This score represents your child's overall neurological health
                  based on their assessment responses.
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {reportData.content.summary && (
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-semibold mb-4'>Assessment Summary</h2>
              <p className='text-gray-700 mb-4'>
                {reportData.content.summary.overview}
              </p>
              {reportData.content.summary.key_findings &&
                reportData.content.summary.key_findings.length > 0 && (
                  <div>
                    <h3 className='font-semibold mb-2'>Key Findings:</h3>
                    <ul className='list-disc list-inside space-y-1 text-gray-700'>
                      {reportData.content.summary.key_findings.map(
                        (finding, index) => (
                          <li key={index}>{finding}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {/* Recommendations */}
          {reportData.content.recommendations &&
            reportData.content.recommendations.length > 0 && (
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h2 className='text-xl font-semibold mb-4'>Recommendations</h2>
                <div className='space-y-4'>
                  {reportData.content.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className='border-l-4 border-blue-500 pl-4'
                    >
                      <h3 className='font-semibold text-gray-900'>
                        {rec.title}
                      </h3>
                      <p className='text-gray-700 mt-1'>{rec.description}</p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : rec.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {rec.priority.charAt(0).toUpperCase() +
                          rec.priority.slice(1)}{' '}
                        Priority
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Report Information */}
          <div className='bg-gray-100 rounded-lg p-4 text-sm text-gray-600'>
            <p>
              <strong>Report generated:</strong>{' '}
              {new Date(reportData.generatedAt).toLocaleDateString()}
            </p>
            <p className='mt-2'>
              <strong>Disclaimer:</strong> This assessment is for educational
              purposes only and does not replace professional medical advice.
              Please consult with a healthcare provider for any health concerns.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons (Mobile) */}
      <div className='fixed bottom-6 right-6 sm:hidden'>
        <div className='flex flex-col gap-3'>
          <button
            onClick={handleShareReport}
            className='rounded-full w-12 h-12 bg-white border border-gray-300 shadow-lg'
          >
            📤
          </button>
          <button
            onClick={handleDownloadPDF}
            className='rounded-full w-12 h-12 bg-blue-600 text-white shadow-lg'
          >
            📥
          </button>
        </div>
      </div>
    </div>
  );
}
