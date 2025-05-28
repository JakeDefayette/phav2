import { useState, useEffect, useCallback } from 'react';
import { brandingService } from '@/services/brandingService';
import type { BrandingData } from '@/types/branding';

export function useBranding(practiceId?: string) {
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await brandingService.getBrandingData(practiceId);
      setBranding(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branding');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const updateBranding = useCallback(async (updates: Partial<BrandingData>) => {
    try {
      setLoading(true);
      const updated = await brandingService.updateBranding(updates);
      setBranding(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update branding'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate CSS variables and Tailwind classes
  const cssVariables = branding
    ? brandingService.generateCSSVariables({
        primaryColor: branding.primary_color,
        secondaryColor: branding.secondary_color,
        accentColor: branding.accent_color,
        logoUrl: branding.logo_url || undefined,
        practiceName: branding.practice_name,
        address: branding.address || '',
        phone: branding.phone || '',
        hours: 'Mon-Fri 9AM-5PM', // Default hours since not in database
        website: branding.website || undefined,
        email: branding.email || undefined,
      })
    : {};

  const tailwindClasses = branding
    ? brandingService.getTailwindClasses({
        primaryColor: branding.primary_color,
        secondaryColor: branding.secondary_color,
        accentColor: branding.accent_color,
        logoUrl: branding.logo_url || undefined,
        practiceName: branding.practice_name,
        address: branding.address || '',
        phone: branding.phone || '',
        hours: 'Mon-Fri 9AM-5PM', // Default hours since not in database
        website: branding.website || undefined,
        email: branding.email || undefined,
      })
    : {};

  return {
    branding,
    loading,
    error,
    updateBranding,
    refetch: loadBranding,
    cssVariables,
    tailwindClasses,
  };
}
