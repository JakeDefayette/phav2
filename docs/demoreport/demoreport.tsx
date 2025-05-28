'use client';

import React from 'react';
import { Button } from '@/shared/components/atoms/Button';
import {
  SpineDiagram,
  BrainOMeter,
  OrganConnections,
  Recommendations,
} from '@/features/reports/components';
import {
  BrandingProvider,
  useBrandingContext,
} from '@/shared/components/BrandingProvider';
import {
  Facebook,
  Mail,
  Phone,
  Share2,
  Calendar,
  ArrowLeft,
  Printer,
} from 'lucide-react';
import {
  dummyContactInfo,
  dummyAffectedRegions,
  dummySymptomsByRegion,
  dummyBrainScore,
  dummyRecommendations,
  dummyOfficeInfo,
  symptomLabels,
  type SpinalRegion,
} from '@/shared/services/dummy-report-data';

function DemoReportContent() {
  const { branding, loading, tailwindClasses } = useBrandingContext();

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

  const officeInfo = branding
    ? {
        name: branding.practice_name,
        address: branding.address,
        phone: branding.phone,
        email: branding.email,
      }
    : dummyOfficeInfo;

  return (
    <main className='min-h-screen bg-[#F7F7F7] py-6'>
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
        {/* Report Header */}
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

        {/* Report Content */}
        <div className='p-6 md:p-8 space-y-8'>
          {/* Personal Greeting */}
          <div>
            <h2
              className='text-2xl font-bold'
              style={{ color: branding?.primary_color || '#333333' }}
            >
              Hello {dummyContactInfo.parentFirstName},
            </h2>
            <p className='mt-2 text-[#333333]'>
              Thank you for completing the health assessment for{' '}
              {dummyContactInfo.childFirstName}. Based on your responses, we've
              identified several areas that may benefit from further evaluation
              and care.
            </p>
          </div>

          {/* Spinal Areas of Concern */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-start'>
            <div className='md:col-span-1'>
              <h3
                className='text-xl font-bold mb-4'
                style={{ color: branding?.primary_color || '#2B5797' }}
              >
                Spinal Areas of Concern
              </h3>
              <SpineDiagram
                cervicalHighlighted={dummyAffectedRegions.includes('cervical')}
                thoracicHighlighted={dummyAffectedRegions.includes('thoracic')}
                lumbarHighlighted={dummyAffectedRegions.includes('lumbar')}
                className='mb-4'
              />
            </div>

            <div className='md:col-span-2 space-y-4'>
              {dummyAffectedRegions.length > 0 ? (
                dummyAffectedRegions.map((region: SpinalRegion) => (
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
                      {region === 'cervical' &&
                        'Affects the head, neck, and upper extremities'}
                      {region === 'thoracic' &&
                        'Affects the chest, mid-back, and internal organs'}
                      {region === 'lumbar' &&
                        'Affects the lower back, pelvis, and lower extremities'}
                    </p>

                    {dummySymptomsByRegion[region].length > 0 ? (
                      <ul className='list-disc list-inside text-sm space-y-1 text-[#333333]'>
                        {dummySymptomsByRegion[region].map(
                          (symptomId: string) => (
                            <li key={symptomId}>{symptomLabels[symptomId]}</li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className='text-sm italic text-[#333333]/70'>
                        No specific symptoms reported in this region.
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className='text-center p-4 bg-[#F7F7F7] rounded-lg'>
                  <p className='text-[#333333]/70'>
                    No specific spinal concerns were identified based on your
                    responses.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Organ System Connections */}
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
              Schedule a complete evaluation to address{' '}
              {dummyContactInfo.childFirstName}'s specific health concerns.
            </p>
            <Button
              className='text-white font-semibold py-2 px-6 rounded-lg text-lg shadow-md hover:opacity-90 transition-opacity'
              style={{
                backgroundColor: branding?.secondary_color || '#FF8C00',
              }}
            >
              <Calendar className='mr-2 h-5 w-5' />
              Schedule a Complete Evaluation
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
                size='icon'
                aria-label='Share via email'
                className='hover:bg-opacity-10'
                style={{
                  borderColor: branding?.primary_color || '#2B5797',
                  color: branding?.primary_color || '#2B5797',
                }}
              >
                <Mail className='h-5 w-5' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                aria-label='Share via text message'
                className='hover:bg-opacity-10'
                style={{
                  borderColor: branding?.primary_color || '#2B5797',
                  color: branding?.primary_color || '#2B5797',
                }}
              >
                <Phone className='h-5 w-5' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                aria-label='Share on Facebook'
                className='hover:bg-opacity-10'
                style={{
                  borderColor: branding?.primary_color || '#2B5797',
                  color: branding?.primary_color || '#2B5797',
                }}
              >
                <Facebook className='h-5 w-5' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                aria-label='Forward to a friend'
                className='hover:bg-opacity-10'
                style={{
                  borderColor: branding?.primary_color || '#2B5797',
                  color: branding?.primary_color || '#2B5797',
                }}
              >
                <Share2 className='h-5 w-5' />
              </Button>
            </div>
          </div>

          {/* Office Details */}
          <div className='bg-[#F7F7F7] p-4 rounded-lg'>
            <h3 className='font-semibold text-[#333333] mb-2'>
              Office Information
            </h3>
            <div className='text-sm text-[#333333]/70 space-y-1'>
              <p>{officeInfo.name}</p>
              <p>{officeInfo.address}</p>
              <p>Phone: {officeInfo.phone}</p>
              {officeInfo.email && <p>Email: {officeInfo.email}</p>}
            </div>
          </div>

          {/* Disclaimer */}
          <div className='text-xs text-[#333333]/70 border-t border-[#333333]/10 pt-4'>
            <p className='mb-1'>
              <strong>Medical Disclaimer:</strong> This report is not a medical
              diagnosis and should not replace professional medical advice.
            </p>
            <p>
              This assessment is for educational purposes only and is designed
              to identify potential areas of concern that may benefit from
              further evaluation by a qualified healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DemoReport() {
  return (
    <BrandingProvider practiceId='demo-practice'>
      <DemoReportContent />
    </BrandingProvider>
  );
}
