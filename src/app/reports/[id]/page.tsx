'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';
import { useAuth } from '@/shared/hooks';
import {
  BrandingProvider,
  useBrandingContext,
} from '@/shared/components/BrandingProvider';
import { PageLayout } from '@/shared/components/templates/PageLayout';
import {
  SpineDiagram,
  BrainOMeter,
  OrganConnections,
  Recommendations,
  SecureReportAccess,
} from '@/features/reports/components';
import { ChartsGrid } from '@/features/reports/components/ChartsGrid';
import { useReportAccess } from '@/features/reports/hooks';
import {
  ArrowLeft,
  Download,
  Share2,
  Calendar,
  Mail,
  User,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface ReportPageContentProps {
  reportId: string;
}

function ReportPageContent({ reportId }: ReportPageContentProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { branding, loading: brandingLoading } = useBrandingContext();
  const { report, charts, loading, error, isDownloading, downloadReport } =
    useReportAccess(reportId);

  // Handle sharing
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pediatric Health Assessment Report',
          text: 'View this pediatric health assessment report',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
        console.log('URL copied to clipboard');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  // Loading state
  if (authLoading || brandingLoading || loading) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <Loading size='lg' />
          <p className='mt-4 text-gray-600'>Loading report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md'>
          <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-gray-900 mb-2'>
            Report Access Error
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <div className='space-y-2'>
            <Button
              onClick={() => router.push('/dashboard')}
              variant='primary'
              className='w-full'
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant='secondary'
              className='w-full'
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No report found
  if (!report) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <Shield className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-gray-900 mb-2'>
            Report Not Found
          </h2>
          <p className='text-gray-600'>
            The requested report could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SecureReportAccess reportId={reportId}>
      <main className='min-h-screen bg-[#F7F7F7] py-6'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
          {/* Header */}
          <div
            className='text-white p-6'
            style={{ backgroundColor: branding?.primary_color || '#2B5797' }}
          >
            <div className='flex justify-between items-center'>
              <div>
                <h1 className='text-2xl md:text-3xl font-bold mb-1'>
                  Pediatric Health Assessment Report
                </h1>
                {report.content?.child && (
                  <p className='text-white/90 text-sm'>
                    For {report.content.child.name}, Age{' '}
                    {report.content.child.age}
                  </p>
                )}
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-white hover:bg-white/20'
                  onClick={() => router.back()}
                  title='Go back'
                >
                  <ArrowLeft className='h-5 w-5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-white hover:bg-white/20'
                  onClick={handleShare}
                  title='Share report'
                >
                  <Share2 className='h-5 w-5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-white hover:bg-white/20'
                  onClick={downloadReport}
                  disabled={isDownloading}
                  title='Download PDF'
                >
                  <Download className='h-5 w-5' />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='p-6 md:p-8 space-y-8'>
            {/* Report metadata */}
            <div className='flex items-center justify-between text-sm text-gray-500 border-b pb-4'>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center'>
                  <Calendar className='h-4 w-4 mr-1' />
                  Generated:{' '}
                  {new Date(report.generated_at).toLocaleDateString()}
                </div>
                {user && (
                  <div className='flex items-center'>
                    <User className='h-4 w-4 mr-1' />
                    {user.email}
                  </div>
                )}
              </div>
              <div className='text-xs'>Report ID: {report.id}</div>
            </div>

            {/* Patient Information */}
            {report.content?.child && (
              <div>
                <h2
                  className='text-2xl font-bold mb-3'
                  style={{ color: branding?.primary_color || '#333333' }}
                >
                  Patient Information
                </h2>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <p className='text-gray-800'>
                    <strong>Name:</strong> {report.content.child.name}
                    <br />
                    <strong>Age:</strong> {report.content.child.age} years old
                    {report.content.child.gender && (
                      <>
                        <br />
                        <strong>Gender:</strong> {report.content.child.gender}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Brain-O-Meter Score */}
            {report.content?.assessment?.brain_o_meter_score !== undefined && (
              <div className='py-4'>
                <BrainOMeter
                  score={report.content.assessment.brain_o_meter_score}
                />
              </div>
            )}

            {/* Visual Data - Spine and Organs */}
            {report.content?.visualData && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-start'>
                <div className='md:col-span-1'>
                  <h3
                    className='text-xl font-bold mb-4'
                    style={{ color: branding?.primary_color || '#2B5797' }}
                  >
                    Spinal Assessment
                  </h3>
                  <SpineDiagram
                    cervicalHighlighted={report.content.visualData.affectedRegions?.includes(
                      'cervical'
                    )}
                    thoracicHighlighted={report.content.visualData.affectedRegions?.includes(
                      'thoracic'
                    )}
                    lumbarHighlighted={report.content.visualData.affectedRegions?.includes(
                      'lumbar'
                    )}
                    className='mb-4'
                  />
                </div>

                <div className='md:col-span-2'>
                  <OrganConnections
                    affectedRegions={
                      report.content.visualData.affectedRegions || []
                    }
                  />
                </div>
              </div>
            )}

            {/* Charts */}
            {charts && charts.length > 0 && (
              <div>
                <h3
                  className='text-xl font-bold mb-4'
                  style={{ color: branding?.primary_color || '#2B5797' }}
                >
                  Assessment Charts
                </h3>
                <ChartsGrid charts={charts} />
              </div>
            )}

            {/* Recommendations */}
            {report.content?.recommendations && (
              <Recommendations
                recommendations={
                  Array.isArray(report.content.recommendations)
                    ? report.content.recommendations.map((rec, index) =>
                        typeof rec === 'string'
                          ? {
                              title: `Recommendation ${index + 1}`,
                              description: rec,
                              priority: 'medium' as const,
                            }
                          : rec
                      )
                    : []
                }
              />
            )}

            {/* Call to Action */}
            <div className='bg-[#F7F7F7] p-6 rounded-lg text-center'>
              <h3
                className='text-xl font-bold mb-2'
                style={{ color: branding?.primary_color || '#2B5797' }}
              >
                Need More Information?
              </h3>
              <p className='mb-4 text-gray-700'>
                Have questions about this report? Contact us for a consultation.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Button
                  onClick={downloadReport}
                  disabled={isDownloading}
                  variant='primary'
                  className='flex items-center justify-center'
                >
                  <Download className='h-4 w-4 mr-2' />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
                {branding?.email && (
                  <Button
                    onClick={() =>
                      (window.location.href = `mailto:${branding.email}`)
                    }
                    variant='secondary'
                    className='flex items-center justify-center'
                  >
                    <Mail className='h-4 w-4 mr-2' />
                    Contact Practice
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </SecureReportAccess>
  );
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params?.id as string;

  if (!reportId) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-gray-900 mb-2'>
            Invalid Report
          </h2>
          <p className='text-gray-600'>No report ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <BrandingProvider>
        <ReportPageContent reportId={reportId} />
      </BrandingProvider>
    </PageLayout>
  );
}
