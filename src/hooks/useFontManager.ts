import { useEffect } from 'react';
import { useConfiguration } from './useConfiguration';
import { applyGlobalFontStyle } from '@/utils/fontManager';

/**
 * Hook to manage global font styling based on hotel configuration
 */
export const useFontManager = () => {
  const { configuration } = useConfiguration();

  useEffect(() => {
    if (configuration?.branding?.font_style) {
      applyGlobalFontStyle(configuration.branding.font_style);
    }
  }, [configuration?.branding?.font_style]);

  return {
    currentFont: configuration?.branding?.font_style || 'playfair'
  };
};