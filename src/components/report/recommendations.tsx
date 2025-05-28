import React from 'react';
import { cn } from '@/utils/cn';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecommendationsProps {
  recommendations: Recommendation[];
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  className,
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981',
}) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className='h-5 w-5 text-red-500' />;
      case 'medium':
        return <Clock className='h-5 w-5 text-yellow-500' />;
      case 'low':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      default:
        return <CheckCircle className='h-5 w-5 text-gray-500' />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Priority';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return secondaryColor;
      default:
        return '#6B7280';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className={cn('p-6 bg-gray-50 rounded-lg', className)}>
        <h3 className='text-xl font-bold mb-4' style={{ color: primaryColor }}>
          Recommendations
        </h3>
        <p className='text-gray-600'>
          Based on the assessment, no specific recommendations are needed at
          this time. Continue with regular wellness check-ups to maintain
          optimal health.
        </p>
      </div>
    );
  }

  // Sort recommendations by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className={cn('space-y-6', className)}>
      <h3 className='text-xl font-bold' style={{ color: primaryColor }}>
        Recommended Next Steps
      </h3>

      <p className='text-gray-700'>
        Based on your child's assessment results, here are our recommendations
        to support their health and development:
      </p>

      <div className='space-y-4'>
        {sortedRecommendations.map((recommendation, index) => (
          <div
            key={index}
            className='bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'
          >
            <div className='flex items-start space-x-4'>
              <div className='flex-shrink-0 mt-1'>
                {getPriorityIcon(recommendation.priority)}
              </div>

              <div className='flex-1'>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='text-lg font-semibold text-gray-900'>
                    {recommendation.title}
                  </h4>
                  <span
                    className='px-3 py-1 rounded-full text-xs font-medium text-white'
                    style={{
                      backgroundColor: getPriorityColor(
                        recommendation.priority
                      ),
                    }}
                  >
                    {getPriorityLabel(recommendation.priority)}
                  </span>
                </div>

                <p className='text-gray-700 leading-relaxed'>
                  {recommendation.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className='bg-blue-50 border border-blue-200 rounded-lg p-6'
        style={{
          backgroundColor: `${primaryColor}10`,
          borderColor: `${primaryColor}30`,
        }}
      >
        <h4 className='font-semibold mb-2' style={{ color: primaryColor }}>
          Ready to Get Started?
        </h4>
        <p className='text-gray-700 text-sm'>
          Our team is here to help your child achieve optimal health and
          wellness. Contact us to schedule a consultation and discuss these
          recommendations in detail.
        </p>
      </div>
    </div>
  );
};
