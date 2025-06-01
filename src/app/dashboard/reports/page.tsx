'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');

  const periods = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'year', label: 'This Year' },
  ];

  const reportCategories = [
    {
      title: 'Assessment Reports',
      description: 'Patient assessment outcomes and progress tracking',
      icon: (
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
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      ),
      reports: [
        'Posture Analysis Summary',
        'Movement Assessment Trends',
        'Pain Level Analytics',
        'Progress Reports',
      ],
    },
    {
      title: 'Practice Analytics',
      description: 'Business insights and practice performance metrics',
      icon: (
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
      ),
      reports: [
        'Patient Demographics',
        'Assessment Completion Rates',
        'Revenue Analytics',
        'Engagement Metrics',
      ],
    },
    {
      title: 'Compliance Reports',
      description: 'Regulatory compliance and quality assurance reports',
      icon: (
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
            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
          />
        </svg>
      ),
      reports: [
        'HIPAA Compliance Report',
        'Data Security Audit',
        'Quality Metrics',
        'Incident Reports',
      ],
    },
  ];

  const recentReports = [
    {
      id: 1,
      title: 'Monthly Patient Progress Report',
      type: 'Assessment',
      generated: '2024-01-15',
      status: 'Ready',
      size: '2.4 MB',
    },
    {
      id: 2,
      title: 'Q4 Practice Analytics',
      type: 'Analytics',
      generated: '2024-01-10',
      status: 'Ready',
      size: '1.8 MB',
    },
    {
      id: 3,
      title: 'HIPAA Compliance Audit',
      type: 'Compliance',
      generated: '2024-01-08',
      status: 'Ready',
      size: '876 KB',
    },
    {
      id: 4,
      title: 'Weekly Assessment Summary',
      type: 'Assessment',
      generated: '2024-01-05',
      status: 'Generating',
      size: '—',
    },
  ];

  return (
    <DashboardLayout>
      <RoleGuard requiredPermission='canViewReports'>
        <div className='container mx-auto px-6 py-8'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Reports</h1>
              <p className='text-gray-600 mt-2'>
                Generate insights and analytics for your practice
              </p>
            </div>
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
              Generate Report
            </Button>
          </div>

          {/* Time Period Selector */}
          <div className='mb-8'>
            <div className='flex space-x-4'>
              {periods.map(period => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedPeriod === period.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Total Patients</p>
                  <p className='text-2xl font-bold text-gray-900'>248</p>
                </div>
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
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Assessments</p>
                  <p className='text-2xl font-bold text-gray-900'>156</p>
                </div>
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
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Completion Rate</p>
                  <p className='text-2xl font-bold text-gray-900'>94%</p>
                </div>
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
                      d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Avg. Score</p>
                  <p className='text-2xl font-bold text-gray-900'>87</p>
                </div>
                <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-orange-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Report Categories */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            {reportCategories.map((category, index) => (
              <Card key={index} className='p-6'>
                <div className='flex items-center mb-4'>
                  <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
                    {category.icon}
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 ml-3'>
                    {category.title}
                  </h3>
                </div>
                <p className='text-gray-600 mb-4'>{category.description}</p>
                <ul className='space-y-2 mb-4'>
                  {category.reports.map((report, reportIndex) => (
                    <li
                      key={reportIndex}
                      className='text-sm text-gray-700 flex items-center'
                    >
                      <svg
                        className='w-4 h-4 text-gray-400 mr-2'
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
                      {report}
                    </li>
                  ))}
                </ul>
                <Button variant='outline' size='sm' className='w-full'>
                  Generate Reports
                </Button>
              </Card>
            ))}
          </div>

          {/* Recent Reports */}
          <Card className='overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900'>
                Recent Reports
              </h3>
            </div>
            <div className='divide-y divide-gray-200'>
              {recentReports.map(report => (
                <div key={report.id} className='px-6 py-4 hover:bg-gray-50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <h4 className='text-lg font-medium text-gray-900'>
                        {report.title}
                      </h4>
                      <div className='flex items-center mt-1 text-sm text-gray-600'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-3'>
                          {report.type}
                        </span>
                        <span>Generated: {report.generated}</span>
                        <span className='mx-2'>•</span>
                        <span>Size: {report.size}</span>
                      </div>
                    </div>
                    <div className='flex items-center space-x-3'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'Ready'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {report.status}
                      </span>
                      {report.status === 'Ready' && (
                        <>
                          <Button variant='ghost' size='sm'>
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                              />
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                              />
                            </svg>
                          </Button>
                          <Button variant='ghost' size='sm'>
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                          </Button>
                        </>
                      )}
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
