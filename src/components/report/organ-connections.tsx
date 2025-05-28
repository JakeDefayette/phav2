import React from 'react';
import { cn } from '@/utils/cn';

interface OrganConnectionsProps {
  affectedRegions: string[];
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const organConnections = {
  cervical: {
    title: 'Cervical Spine Connections',
    organs: [
      'Brain and nervous system',
      'Eyes, ears, nose, throat',
      'Thyroid and parathyroid',
      'Arms and hands',
      'Heart and lungs',
    ],
    description:
      'The cervical spine houses nerves that control many vital functions in the head, neck, and upper body.',
  },
  thoracic: {
    title: 'Thoracic Spine Connections',
    organs: [
      'Heart and cardiovascular system',
      'Lungs and respiratory system',
      'Stomach and digestive organs',
      'Liver and gallbladder',
      'Kidneys and adrenals',
    ],
    description:
      'The thoracic spine contains nerves that regulate organ function throughout the chest and abdomen.',
  },
  lumbar: {
    title: 'Lumbar Spine Connections',
    organs: [
      'Lower digestive tract',
      'Reproductive organs',
      'Bladder and elimination',
      'Hips and legs',
      'Lower back muscles',
    ],
    description:
      'The lumbar spine controls nerve function to the lower body and pelvic organs.',
  },
};

export const OrganConnections: React.FC<OrganConnectionsProps> = ({
  affectedRegions,
  className,
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981',
}) => {
  if (affectedRegions.length === 0) {
    return (
      <div className={cn('p-6 bg-gray-50 rounded-lg', className)}>
        <h3 className='text-xl font-bold mb-4' style={{ color: primaryColor }}>
          Organ System Connections
        </h3>
        <p className='text-gray-600'>
          No specific spinal regions were identified as areas of concern. This
          is a positive finding that suggests good overall spinal health.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <h3 className='text-xl font-bold' style={{ color: primaryColor }}>
        How Spinal Health Affects Your Child's Body
      </h3>

      <p className='text-gray-700'>
        The spine houses the nervous system that controls every function in your
        child's body. When spinal segments are not functioning optimally, it can
        affect the organs and systems they control.
      </p>

      <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-2'>
        {affectedRegions.map(region => {
          const connection =
            organConnections[region as keyof typeof organConnections];
          if (!connection) return null;

          return (
            <div
              key={region}
              className='border-l-4 pl-6 py-4 bg-white rounded-r-lg shadow-sm'
              style={{ borderLeftColor: secondaryColor }}
            >
              <h4
                className='text-lg font-semibold mb-3'
                style={{ color: primaryColor }}
              >
                {connection.title}
              </h4>

              <p className='text-sm text-gray-600 mb-4'>
                {connection.description}
              </p>

              <div>
                <h5 className='font-medium text-gray-800 mb-2'>
                  Connected Systems:
                </h5>
                <ul className='space-y-1'>
                  {connection.organs.map((organ, index) => (
                    <li
                      key={index}
                      className='flex items-center text-sm text-gray-700'
                    >
                      <div
                        className='w-2 h-2 rounded-full mr-3 flex-shrink-0'
                        style={{ backgroundColor: secondaryColor }}
                      />
                      {organ}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
        <h4 className='font-semibold text-blue-900 mb-2'>Why This Matters</h4>
        <p className='text-blue-800 text-sm'>
          Understanding these connections helps explain why spinal health is so
          important for your child's overall wellness. Chiropractic care focuses
          on optimizing spinal function to support the body's natural healing
          abilities.
        </p>
      </div>
    </div>
  );
};
