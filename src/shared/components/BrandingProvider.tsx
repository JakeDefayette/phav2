'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { BrandingData } from '@/shared/types/branding';
import { useBranding } from '@/shared/hooks';

interface BrandingContextType {
  branding: BrandingData | null;
  loading: boolean;
  error: string | null;
  cssVariables: Record<string, string>;
  tailwindClasses: Record<string, string>;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(
  undefined
);

interface BrandingProviderProps {
  children: React.ReactNode;
  practiceId?: string;
  className?: string;
}

export function BrandingProvider({
  children,
  practiceId,
  className,
}: BrandingProviderProps) {
  const brandingData = useBranding(practiceId);
  const { cssVariables } = brandingData;

  // Apply CSS variables to the DOM
  useEffect(() => {
    if (cssVariables && Object.keys(cssVariables).length > 0) {
      const root = document.documentElement;
      Object.entries(cssVariables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });

      // Cleanup function to remove variables when component unmounts
      return () => {
        Object.keys(cssVariables).forEach(property => {
          root.style.removeProperty(property);
        });
      };
    }
  }, [cssVariables]);

  const contextValue: BrandingContextType = {
    ...brandingData,
    refreshBranding: brandingData.refetch,
  };

  return (
    <BrandingContext.Provider value={contextValue}>
      <div className={className} style={cssVariables}>
        {children}
      </div>
    </BrandingContext.Provider>
  );
}

export function useBrandingContext(): BrandingContextType {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error(
      'useBrandingContext must be used within a BrandingProvider'
    );
  }
  return context;
}

export default BrandingProvider;
