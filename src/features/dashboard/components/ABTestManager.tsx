'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Input } from '@/shared/components/atoms/Input';
import { Label } from '@/shared/components/atoms/Label';
import { Loading } from '@/shared/components/atoms/Loading';
import { Alert } from '@/shared/components/molecules/Alert';
import { FormField } from '@/shared/components/molecules/FormField';
import { CampaignManager, ABTestConfig } from '../services/campaignManager';
import {
  FlaskConical,
  TrendingUp,
  Crown,
  BarChart3,
  Users,
  Mail,
  MousePointer,
  Eye,
  Split,
} from 'lucide-react';

interface ABTestVariant {
  id: string;
  name: string;
  percentage: number;
  subject?: string;
  content?: string;
}

interface ABTestResults {
  testId: string;
  status: 'running' | 'completed' | 'cancelled';
  variants: Array<{
    id: string;
    name: string;
    sends: number;
    opens: number;
    clicks: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  winner?: string;
}

interface ABTestManagerProps {
  campaignId: string;
  campaignManager: CampaignManager;
  onTestCreated?: (testId: string) => void;
  onTestUpdated?: (results: ABTestResults) => void;
}

export const ABTestManager: React.FC<ABTestManagerProps> = ({
  campaignId,
  campaignManager,
  onTestCreated,
  onTestUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Test configuration
  const [testConfig, setTestConfig] = useState<ABTestConfig>({
    enabled: false,
    variants: [
      { name: 'Variant A', subject: '', content: '', percentage: 50 },
      { name: 'Variant B', subject: '', content: '', percentage: 50 },
    ],
    winningCriteria: 'open_rate',
    testDuration: 24,
    autoSelectWinner: true,
  });

  // Test results
  const [testResults, setTestResults] = useState<ABTestResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadExistingTest();
  }, [campaignId]);

  const loadExistingTest = async () => {
    try {
      const results = await campaignManager.getABTestResults(campaignId);
      setTestResults(results);
      setShowResults(true);
    } catch (error) {
      // No existing test found - this is normal
      console.log('No existing A/B test found for this campaign');
    }
  };

  const handleCreateTest = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate test configuration
      if (testConfig.variants.length < 2) {
        throw new Error('At least 2 variants are required for A/B testing');
      }

      const totalPercentage = testConfig.variants.reduce(
        (sum, v) => sum + v.percentage,
        0
      );
      if (totalPercentage !== 100) {
        throw new Error('Variant percentages must add up to 100%');
      }

      const result = await campaignManager.createABTest(campaignId, testConfig);

      setSuccess('A/B test created successfully!');
      onTestCreated?.(result.testId);

      // Load the test results
      await loadExistingTest();
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create A/B test'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ABTestVariant,
    value: string | number
  ) => {
    const updatedVariants = [...testConfig.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };
    setTestConfig({
      ...testConfig,
      variants: updatedVariants,
    });
  };

  const handleAddVariant = () => {
    if (testConfig.variants.length >= 5) {
      setError('Maximum 5 variants allowed');
      return;
    }

    const newVariant: Omit<ABTestVariant, 'id'> = {
      name: `Variant ${String.fromCharCode(65 + testConfig.variants.length)}`,
      subject: '',
      content: '',
      percentage: 0,
    };

    setTestConfig({
      ...testConfig,
      variants: [...testConfig.variants, newVariant],
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (testConfig.variants.length <= 2) {
      setError('At least 2 variants are required');
      return;
    }

    const updatedVariants = testConfig.variants.filter((_, i) => i !== index);
    setTestConfig({
      ...testConfig,
      variants: updatedVariants,
    });
  };

  const redistributePercentages = () => {
    const equalPercentage = Math.floor(100 / testConfig.variants.length);
    const remainder = 100 % testConfig.variants.length;

    const updatedVariants = testConfig.variants.map((variant, index) => ({
      ...variant,
      percentage: equalPercentage + (index < remainder ? 1 : 0),
    }));

    setTestConfig({
      ...testConfig,
      variants: updatedVariants,
    });
  };

  const getWinnerIcon = (variantId: string) => {
    if (testResults?.winner === variantId) {
      return <Crown className='w-4 h-4 text-yellow-500' />;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (showResults && testResults) {
    return (
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <FlaskConical className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                A/B Test Results
              </h2>
              <p className='text-gray-600'>Test ID: {testResults.testId}</p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(testResults.status)}`}
            >
              {testResults.status}
            </span>
          </div>
        </div>

        {error && (
          <Alert
            variant='error'
            onClose={() => setError(null)}
            className='mb-4'
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant='success'
            onClose={() => setSuccess(null)}
            className='mb-4'
          >
            {success}
          </Alert>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {testResults.variants.map(variant => (
            <Card key={variant.id} className='p-4 border-2 border-gray-200'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-2'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    {variant.name}
                  </h3>
                  {getWinnerIcon(variant.id)}
                </div>
                {testResults.winner === variant.id && (
                  <span className='px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full'>
                    Winner
                  </span>
                )}
              </div>

              <div className='grid grid-cols-2 gap-4 mb-4'>
                <div className='flex items-center space-x-2'>
                  <Mail className='w-4 h-4 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Sends</p>
                    <p className='text-lg font-semibold text-gray-900'>
                      {variant.sends.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Eye className='w-4 h-4 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Opens</p>
                    <p className='text-lg font-semibold text-gray-900'>
                      {variant.opens.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <MousePointer className='w-4 h-4 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Clicks</p>
                    <p className='text-lg font-semibold text-gray-900'>
                      {variant.clicks.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <TrendingUp className='w-4 h-4 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Conversions</p>
                    <p className='text-lg font-semibold text-gray-900'>
                      {variant.conversions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Open Rate</span>
                  <span className='font-medium'>
                    {formatPercentage(variant.openRate)}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full'
                    style={{ width: `${Math.min(variant.openRate, 100)}%` }}
                  ></div>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Click Rate</span>
                  <span className='font-medium'>
                    {formatPercentage(variant.clickRate)}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full'
                    style={{ width: `${Math.min(variant.clickRate, 100)}%` }}
                  ></div>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Conversion Rate</span>
                  <span className='font-medium'>
                    {formatPercentage(variant.conversionRate)}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-purple-500 h-2 rounded-full'
                    style={{
                      width: `${Math.min(variant.conversionRate, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className='flex justify-end space-x-3 mt-6'>
          <Button variant='outline' onClick={() => setShowResults(false)}>
            Edit Test
          </Button>
          <Button onClick={() => window.location.reload()}>
            Refresh Results
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className='p-6'>
      <div className='flex items-center space-x-3 mb-6'>
        <div className='p-2 bg-blue-100 rounded-lg'>
          <Split className='w-6 h-6 text-blue-600' />
        </div>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>
            A/B Test Setup
          </h2>
          <p className='text-gray-600'>
            Create split tests to optimize your email performance
          </p>
        </div>
      </div>

      {error && (
        <Alert variant='error' onClose={() => setError(null)} className='mb-4'>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant='success'
          onClose={() => setSuccess(null)}
          className='mb-4'
        >
          {success}
        </Alert>
      )}

      <div className='space-y-6'>
        {/* Test Settings */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <FormField label='Winning Criteria' htmlFor='winning-criteria'>
            <select
              id='winning-criteria'
              value={testConfig.winningCriteria}
              onChange={e =>
                setTestConfig({
                  ...testConfig,
                  winningCriteria: e.target
                    .value as ABTestConfig['winningCriteria'],
                })
              }
              className='w-full border border-gray-300 rounded-md px-3 py-2'
            >
              <option value='open_rate'>Open Rate</option>
              <option value='click_rate'>Click Rate</option>
              <option value='conversion_rate'>Conversion Rate</option>
            </select>
          </FormField>

          <FormField label='Test Duration (hours)' htmlFor='test-duration'>
            <Input
              id='test-duration'
              type='number'
              min='1'
              max='168'
              value={testConfig.testDuration}
              onChange={e =>
                setTestConfig({
                  ...testConfig,
                  testDuration: parseInt(e.target.value) || 24,
                })
              }
            />
          </FormField>
        </div>

        <div className='flex items-center space-x-2'>
          <input
            type='checkbox'
            id='auto-select'
            checked={testConfig.autoSelectWinner}
            onChange={e =>
              setTestConfig({
                ...testConfig,
                autoSelectWinner: e.target.checked,
              })
            }
            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
          />
          <Label htmlFor='auto-select'>
            Automatically select winner after test duration
          </Label>
        </div>

        {/* Variants */}
        <div>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-medium text-gray-900'>Test Variants</h3>
            <div className='space-x-2'>
              <Button variant='outline' onClick={redistributePercentages}>
                Redistribute Evenly
              </Button>
              <Button variant='outline' onClick={handleAddVariant}>
                Add Variant
              </Button>
            </div>
          </div>

          <div className='space-y-4'>
            {testConfig.variants.map((variant, index) => (
              <Card key={index} className='p-4'>
                <div className='flex justify-between items-center mb-4'>
                  <h4 className='font-medium text-gray-900'>
                    Variant {String.fromCharCode(65 + index)}
                  </h4>
                  {testConfig.variants.length > 2 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleRemoveVariant(index)}
                      className='text-red-600 hover:text-red-700'
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <FormField
                    label='Variant Name'
                    htmlFor={`variant-name-${index}`}
                  >
                    <Input
                      id={`variant-name-${index}`}
                      value={variant.name}
                      onChange={e =>
                        handleUpdateVariant(index, 'name', e.target.value)
                      }
                      placeholder='e.g., Control, Treatment'
                    />
                  </FormField>

                  <FormField
                    label='Traffic Percentage'
                    htmlFor={`variant-percentage-${index}`}
                  >
                    <div className='flex items-center space-x-2'>
                      <Input
                        id={`variant-percentage-${index}`}
                        type='number'
                        min='0'
                        max='100'
                        value={variant.percentage}
                        onChange={e =>
                          handleUpdateVariant(
                            index,
                            'percentage',
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                      <span className='text-gray-500'>%</span>
                    </div>
                  </FormField>

                  <div className='flex items-end'>
                    <div className='w-full bg-gray-200 rounded-full h-3'>
                      <div
                        className='bg-blue-500 h-3 rounded-full transition-all'
                        style={{ width: `${variant.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 mt-4'>
                  <FormField
                    label='Subject Line'
                    htmlFor={`variant-subject-${index}`}
                  >
                    <Input
                      id={`variant-subject-${index}`}
                      value={variant.subject || ''}
                      onChange={e =>
                        handleUpdateVariant(index, 'subject', e.target.value)
                      }
                      placeholder='Subject line for this variant'
                    />
                  </FormField>

                  <FormField
                    label='Email Content Preview'
                    htmlFor={`variant-content-${index}`}
                  >
                    <textarea
                      id={`variant-content-${index}`}
                      value={variant.content || ''}
                      onChange={e =>
                        handleUpdateVariant(index, 'content', e.target.value)
                      }
                      placeholder='Brief description or key differences for this variant'
                      rows={3}
                      className='w-full border border-gray-300 rounded-md px-3 py-2'
                    />
                  </FormField>
                </div>
              </Card>
            ))}
          </div>

          {/* Total Percentage Check */}
          <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>
                Total Traffic Allocation:
              </span>
              <span
                className={`font-medium ${
                  testConfig.variants.reduce(
                    (sum, v) => sum + v.percentage,
                    0
                  ) === 100
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {testConfig.variants.reduce((sum, v) => sum + v.percentage, 0)}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className={`h-2 rounded-full transition-all ${
                  testConfig.variants.reduce(
                    (sum, v) => sum + v.percentage,
                    0
                  ) === 100
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(
                    testConfig.variants.reduce(
                      (sum, v) => sum + v.percentage,
                      0
                    ),
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
          <Button variant='outline' onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTest}
            disabled={
              isLoading ||
              testConfig.variants.reduce((sum, v) => sum + v.percentage, 0) !==
                100
            }
            className='flex items-center space-x-2'
          >
            {isLoading ? (
              <Loading size='sm' />
            ) : (
              <FlaskConical className='w-4 h-4' />
            )}
            <span>Create A/B Test</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ABTestManager;
