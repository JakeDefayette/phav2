'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<
    'active' | 'completed' | 'archived'
  >('active');

  const tabs = [
    { id: 'active', label: 'Active Assessments', count: 12 },
    { id: 'completed', label: 'Completed', count: 45 },
    { id: 'archived', label: 'Archived', count: 8 },
  ];

  const mockAssessments = {
    active: [
      {
        id: 1,
        patientName: 'Sarah Johnson',
        type: 'Posture Assessment',
        started: '2024-01-15',
        progress: 75,
      },
      {
        id: 2,
        patientName: 'Mike Chen',
        type: 'Movement Analysis',
        started: '2024-01-14',
        progress: 50,
      },
      {
        id: 3,
        patientName: 'Emily Davis',
        type: 'Pain Assessment',
        started: '2024-01-13',
        progress: 90,
      },
    ],
    completed: [
      {
        id: 4,
        patientName: 'John Smith',
        type: 'Posture Assessment',
        completed: '2024-01-10',
        score: 85,
      },
      {
        id: 5,
        patientName: 'Lisa Wong',
        type: 'Movement Analysis',
        completed: '2024-01-08',
        score: 92,
      },
    ],
    archived: [
      {
        id: 6,
        patientName: 'Robert Brown',
        type: 'Pain Assessment',
        archived: '2023-12-15',
        score: 78,
      },
    ],
  };

  return (
    <DashboardLayout>
      <RoleGuard requiredPermission='canViewAllAssessments'>
        <div className='container mx-auto px-6 py-8'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Assessments</h1>
              <p className='text-gray-600 mt-2'>
                Manage patient assessments and track progress
              </p>
            </div>
            <RoleGuard requiredPermission='canManagePractice'>
              <Button variant='primary' size='md'>
                <svg
                  className='w-5 h-5 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                New Assessment
              </Button>
            </RoleGuard>
          </div>

          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <Card className='p-6'>
              <div className='flex items-center'>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div className='ml-4'>
                  <h3 className='text-2xl font-bold text-gray-900'>65</h3>
                  <p className='text-gray-600'>Total Assessments</p>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center'>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                    />
                  </svg>
                </div>
                <div className='ml-4'>
                  <h3 className='text-2xl font-bold text-gray-900'>89%</h3>
                  <p className='text-gray-600'>Completion Rate</p>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center'>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-purple-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div className='ml-4'>
                  <h3 className='text-2xl font-bold text-gray-900'>2.5</h3>
                  <p className='text-gray-600'>Avg. Days to Complete</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Assessment Types */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Posture Assessment
              </h3>
              <p className='text-gray-600 mb-4'>
                Comprehensive postural analysis and recommendations
              </p>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500'>15 active</span>
                <Button variant='outline' size='sm'>
                  Start New
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Movement Analysis
              </h3>
              <p className='text-gray-600 mb-4'>
                Dynamic movement patterns and functional assessment
              </p>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500'>8 active</span>
                <Button variant='outline' size='sm'>
                  Start New
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Pain Assessment
              </h3>
              <p className='text-gray-600 mb-4'>
                Pain level tracking and symptom monitoring
              </p>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500'>12 active</span>
                <Button variant='outline' size='sm'>
                  Start New
                </Button>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className='border-b border-gray-200 mb-6'>
            <nav className='-mb-px flex space-x-8'>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className='ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs'>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Assessment List */}
          <Card className='overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900'>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h3>
            </div>
            <div className='divide-y divide-gray-200'>
              {mockAssessments[activeTab].map((assessment: any) => (
                <div key={assessment.id} className='px-6 py-4 hover:bg-gray-50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <h4 className='text-lg font-medium text-gray-900'>
                        {assessment.patientName}
                      </h4>
                      <p className='text-sm text-gray-600'>{assessment.type}</p>
                      <div className='flex items-center mt-2 text-xs text-gray-500'>
                        {assessment.started && (
                          <span>Started: {assessment.started}</span>
                        )}
                        {assessment.completed && (
                          <span>Completed: {assessment.completed}</span>
                        )}
                        {assessment.archived && (
                          <span>Archived: {assessment.archived}</span>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center space-x-4'>
                      {assessment.progress !== undefined && (
                        <div className='flex items-center'>
                          <div className='w-20 bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-blue-600 h-2 rounded-full'
                              style={{ width: `${assessment.progress}%` }}
                            />
                          </div>
                          <span className='ml-2 text-sm text-gray-600'>
                            {assessment.progress}%
                          </span>
                        </div>
                      )}
                      {assessment.score !== undefined && (
                        <div className='text-right'>
                          <div className='text-lg font-semibold text-gray-900'>
                            {assessment.score}
                          </div>
                          <div className='text-xs text-gray-500'>Score</div>
                        </div>
                      )}
                      <Button variant='outline' size='sm'>
                        {activeTab === 'active' ? 'Continue' : 'View'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
