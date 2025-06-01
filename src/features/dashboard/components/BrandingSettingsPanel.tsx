'use client';

import React, { useState } from 'react';
import { useBrandingContext } from '@/shared/components/BrandingProvider';
import { Button } from '@/shared/components/atoms/Button';
import { Card } from '@/shared/components/molecules/Card';
import { Alert } from '@/shared/components/molecules/Alert';
import { Loading } from '@/shared/components/atoms/Loading';
import { LogoUploader } from './LogoUploader';
import { ColorPicker } from './ColorPicker';

interface BrandingSettingsPanelProps {
  practiceId?: string;
}

export function BrandingSettingsPanel({
  practiceId,
}: BrandingSettingsPanelProps) {
  const { branding, loading, error, refreshBranding } = useBrandingContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for temporary changes before saving
  const [tempBranding, setTempBranding] = useState({
    logo_url: branding?.logo_url || '',
    primary_color: branding?.primary_color || '#2B5797',
    secondary_color: branding?.secondary_color || '#FF8C00',
    practice_name: branding?.practice_name || '',
  });

  const handleLogoChange = (logoUrl: string) => {
    setTempBranding(prev => ({ ...prev, logo_url: logoUrl }));
  };

  const handleColorChange = (
    colorType: 'primary' | 'secondary',
    color: string
  ) => {
    setTempBranding(prev => ({
      ...prev,
      [`${colorType}_color`]: color,
    }));
  };

  const handleSave = async () => {
    if (!branding?.practice_id) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Import brandingService dynamically to avoid SSR issues
      const { brandingService } = await import(
        '@/shared/services/brandingService'
      );

      await brandingService.updateBranding({
        practice_id: branding.practice_id,
        logo_url: tempBranding.logo_url || null,
        primary_color: tempBranding.primary_color,
        secondary_color: tempBranding.secondary_color,
        practice_name: tempBranding.practice_name,
      });

      await refreshBranding();
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save branding settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTempBranding({
      logo_url: branding?.logo_url || '',
      primary_color: branding?.primary_color || '#2B5797',
      secondary_color: branding?.secondary_color || '#FF8C00',
      practice_name: branding?.practice_name || '',
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const hasChanges = React.useMemo(() => {
    return (
      tempBranding.logo_url !== (branding?.logo_url || '') ||
      tempBranding.primary_color !== (branding?.primary_color || '#2B5797') ||
      tempBranding.secondary_color !==
        (branding?.secondary_color || '#FF8C00') ||
      tempBranding.practice_name !== (branding?.practice_name || '')
    );
  }, [tempBranding, branding]);

  if (loading) {
    return (
      <Card className='p-6'>
        <div className='flex items-center justify-center py-8'>
          <Loading size='lg' />
          <span className='ml-3 text-gray-600'>
            Loading branding settings...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='p-6'>
        <Alert
          variant='error'
          title='Error Loading Branding Settings'
          description={error}
        />
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-gray-900'>
              Practice Branding
            </h2>
            <p className='text-gray-600 mt-1'>
              Customize your practice logo and colors to match your brand
              identity.
            </p>
          </div>
          <div className='flex space-x-3'>
            {hasChanges && (
              <Button
                variant='outline'
                onClick={handleReset}
                disabled={isSaving}
              >
                Reset Changes
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className='min-w-[100px]'
            >
              {isSaving ? <Loading size='sm' /> : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert
          variant='success'
          title='Branding Updated'
          description='Your practice branding has been successfully updated.'
        />
      )}

      {saveError && (
        <Alert variant='error' title='Save Failed' description={saveError} />
      )}

      {/* Main Settings Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Logo Upload Section */}
        <Card className='p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Practice Logo
          </h3>
          <LogoUploader
            currentLogo={tempBranding.logo_url}
            onLogoChange={handleLogoChange}
            practiceId={practiceId}
          />
        </Card>

        {/* Color Scheme Section */}
        <Card className='p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Color Scheme
          </h3>
          <div className='space-y-6'>
            <ColorPicker
              label='Primary Color'
              value={tempBranding.primary_color}
              onChange={color => handleColorChange('primary', color)}
              description='Used for buttons, links, and primary accents'
            />
            <ColorPicker
              label='Secondary Color'
              value={tempBranding.secondary_color}
              onChange={color => handleColorChange('secondary', color)}
              description='Used for secondary elements and highlights'
            />
          </div>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Preview</h3>
        <div className='space-y-4'>
          <div className='p-4 border border-gray-200 rounded-lg bg-gray-50'>
            <div className='flex items-center space-x-4 mb-4'>
              {tempBranding.logo_url && (
                <img
                  src={tempBranding.logo_url}
                  alt='Practice Logo'
                  className='h-12 w-auto object-contain'
                />
              )}
              <div>
                <h4 className='font-semibold text-gray-900'>
                  {tempBranding.practice_name || 'Your Practice Name'}
                </h4>
                <p className='text-sm text-gray-600'>Dashboard Preview</p>
              </div>
            </div>

            <div className='flex space-x-3'>
              <button
                className='px-4 py-2 rounded-md text-white font-medium'
                style={{ backgroundColor: tempBranding.primary_color }}
              >
                Primary Button
              </button>
              <button
                className='px-4 py-2 rounded-md text-white font-medium'
                style={{ backgroundColor: tempBranding.secondary_color }}
              >
                Secondary Button
              </button>
            </div>
          </div>

          <p className='text-sm text-gray-500'>
            This preview shows how your branding will appear in the dashboard.
            Changes will be applied across all dashboard components after
            saving.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default BrandingSettingsPanel;
