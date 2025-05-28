'use client';
import React from 'react';
import { Button } from '@/components/atoms/Button';
import {
  SpineDiagram,
  BrainOMeter,
  OrganConnections,
  Recommendations,
} from '@/components/report';
import {
  useBrandingContext,
  BrandingProvider,
} from '@/components/providers/BrandingProvider';
import {
  ArrowLeft,
  Printer,
  Share2,
  Calendar,
  Mail,
  MessageSquare,
} from 'lucide-react';
import {
  dummyContactInfo,
  dummyOfficeInfo,
  dummyAffectedRegions,
  dummySymptomsByRegion,
  symptomLabels,
  dummyBrainScore,
  dummyRecommendations,
  type SpinalRegion,
} from '@/lib/dummy-report-data';

function DemoReportContent() {
  const { branding, loading, error } = useBrandingContext();

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Branding error occurred, using fallback values
  }

  // Use branding data or fallback to office info
  const officeInfo = branding
    ? {
        name: branding.practice_name || dummyOfficeInfo.name,
        address: branding.address || dummyOfficeInfo.address,
        phone: branding.phone || dummyOfficeInfo.phone,
        hours: dummyOfficeInfo.hours,
        email: branding.email || dummyOfficeInfo.email,
        website: dummyOfficeInfo.website,
      }
    : dummyOfficeInfo;

  return (
    <main className='min-h-screen bg-[#F7F7F7] py-6'>
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
        {/* Header */}
        <div
          className='text-white p-6'
          style={{ backgroundColor: branding?.primary_color || '#2B5797' }}
        >
          <div className='flex justify-between items-center'>
            <h1 className='text-2xl md:text-3xl font-bold'>
              Pediatric Health Assessment Report
            </h1>
            <div className='flex space-x-2'>
              <Button
                variant='ghost'
                size='icon'
                className='text-white hover:bg-white/20'
              >
                <ArrowLeft className='h-5 w-5' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='text-white hover:bg-white/20'
                onClick={() => window.print()}
              >
                <Printer className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 md:p-8 space-y-8'>
          {/* Patient Information */}
          <div>
            <h2
              className='text-2xl font-bold'
              style={{ color: branding?.primary_color || '#333333' }}
            >
              Patient Information
            </h2>
            <p className='mt-2 text-[#333333]'>
              <strong>Patient:</strong> {dummyContactInfo.childFirstName}{' '}
              {dummyContactInfo.childLastName}, Age {dummyContactInfo.childAge}
              <br />
              <strong>Parent/Guardian:</strong>{' '}
              {dummyContactInfo.parentFirstName}{' '}
              {dummyContactInfo.parentLastName}
              <br />
              <strong>Contact:</strong> {dummyContactInfo.email} |{' '}
              {dummyContactInfo.phone}
            </p>
          </div>

          {/* Spinal Assessment */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-start'>
            <div className='md:col-span-1'>
              <h3
                className='text-xl font-bold mb-4'
                style={{ color: branding?.primary_color || '#2B5797' }}
              >
                Spinal Assessment
              </h3>
              <SpineDiagram
                cervicalHighlighted={dummyAffectedRegions.includes('cervical')}
                thoracicHighlighted={dummyAffectedRegions.includes('thoracic')}
                lumbarHighlighted={dummyAffectedRegions.includes('lumbar')}
                className='mb-4'
              />
            </div>

            <div className='md:col-span-2 space-y-4'>
              {dummyAffectedRegions.map((region: SpinalRegion) => (
                <div
                  key={region}
                  className='border-l-4 pl-4 py-2'
                  style={{
                    borderColor: branding?.secondary_color || '#FF8C00',
                  }}
                >
                  <h4 className='font-bold text-lg capitalize text-[#333333]'>
                    {region} Region
                  </h4>
                  <p className='text-sm text-[#333333]/70 mb-2'>
                    Assessment shows concerns in the {region} region of the
                    spine.
                  </p>
                  {dummySymptomsByRegion[region].length > 0 ? (
                    <div>
                      <p className='text-sm font-medium text-[#333333] mb-1'>
                        Reported symptoms:
                      </p>
                      <ul className='list-disc list-inside text-sm space-y-1 text-[#333333]'>
                        {dummySymptomsByRegion[region].map(
                          (symptomId: string) => (
                            <li key={symptomId}>{symptomLabels[symptomId]}</li>
                          )
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p className='text-sm italic text-[#333333]/70'>
                      No specific symptoms reported in this region.
                    </p>
                  )}
                </div>
              ))}
              {dummyAffectedRegions.length === 0 && (
                <div className='text-center p-4 bg-[#F7F7F7] rounded-lg'>
                  <p className='text-[#333333]/70'>
                    No specific spinal regions flagged for concern at this time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Organ Connections */}
          <OrganConnections affectedRegions={dummyAffectedRegions} />

          {/* Brain-O-Meter */}
          <div className='py-4'>
            <BrainOMeter score={dummyBrainScore} />
          </div>

          {/* Recommendations */}
          <Recommendations recommendations={dummyRecommendations} />

          {/* Call to Action */}
          <div className='bg-[#F7F7F7] p-6 rounded-lg text-center'>
            <h3
              className='text-xl font-bold mb-2'
              style={{ color: branding?.primary_color || '#2B5797' }}
            >
              Ready to Take the Next Step?
            </h3>
            <p className='mb-4 text-[#333333]'>
              Schedule a comprehensive evaluation to develop a personalized care
              plan for {dummyContactInfo.childFirstName}.
            </p>
            <Button
              className='text-white font-semibold py-2 px-6 rounded-lg text-lg shadow-md hover:opacity-90 transition-opacity'
              style={{
                backgroundColor: branding?.secondary_color || '#FF8C00',
              }}
            >
              <Calendar className='mr-2 h-5 w-5' />
              Schedule Appointment
            </Button>
          </div>

          {/* Share Options */}
          <div className='border-t border-[#333333]/10 pt-6'>
            <h3 className='text-lg font-semibold text-[#333333] mb-3'>
              Share This Report
            </h3>
            <div className='flex justify-center space-x-4'>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center space-x-2'
                style={{
                  borderColor: branding?.primary_color || '#2B5797',
                  color: branding?.primary_color || '#2B5797',
                }}
              >
                <Mail className='h-5 w-5' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center space-x-2'
                style={{
                  borderColor: branding?.primary_color || '#2B5797',
                  color: branding?.primary_color || '#2B5797',
                }}
              >
                <MessageSquare className='h-5 w-5' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center space-x-2'
                style={{
                  borderColor: branding?.primary_color || '#2B5797',
                  color: branding?.primary_color || '#2B5797',
                }}
              >
                <Share2 className='h-5 w-5' />
              </Button>
            </div>
          </div>

          {/* Office Information */}
          <div className='bg-[#F7F7F7] p-4 rounded-lg'>
            <h3 className='font-semibold text-[#333333] mb-2'>
              Office Information
            </h3>
            <div className='text-sm text-[#333333]/70 space-y-1'>
              <p>{officeInfo.name}</p>
              <p>{officeInfo.address}</p>
              <p>Phone: {officeInfo.phone}</p>
              <p>Hours: {officeInfo.hours}</p>
              {officeInfo.email && <p>Email: {officeInfo.email}</p>}
            </div>
          </div>

          {/* Disclaimer */}
          <div className='text-xs text-[#333333]/70 border-t border-[#333333]/10 pt-4'>
            <p className='mb-1'>
              <strong>Medical Disclaimer:</strong> This report is not a medical
              diagnosis and should not replace professional medical advice.
              Please consult with a qualified healthcare provider for proper
              diagnosis and treatment.
            </p>
            <p>
              <strong>Privacy Notice:</strong> This report contains confidential
              health information. Please handle accordingly.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DemoReportPage() {
  return (
    <BrandingProvider>
      <DemoReportContent />
    </BrandingProvider>
  );
}
